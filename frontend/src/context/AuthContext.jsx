import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Supabase auth user
  const [profile, setProfile] = useState(null); // Our profiles table row
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) await fetchProfile(session.user.id);
        else { setProfile(null); setLoading(false); }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error) setProfile(data);
    setLoading(false);
  };

  // ── Auth actions ──────────────────────────────────────────────────────────

  /**
   * Send email OTP.
   * @param {string}  email           - recipient email address
   * @param {boolean} shouldCreateUser - true for new staff registration,
   *                                     false for existing staff/admin login
   */
  /**
   * Send an OTP to `email`.
   * For registration (shouldCreateUser=true): we first create the auth user with
   * a random password (which avoids the "Confirm Signup" email that triggers 500),
   * then immediately send a plain OTP — same template as admin login.
   * For login (shouldCreateUser=false): just sends OTP to existing user.
   */
  const sendEmailOtp = async (email, shouldCreateUser = false) => {
    // ── REGISTRATION PATH ────────────────────────────────────────────────────
    if (shouldCreateUser) {
      // Step 1: create the auth user silently (no confirmation email sent)
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: crypto.randomUUID(), // random — user will never enter this
        options: { emailRedirectTo: undefined }, // suppress confirmation email
      });

      // Ignore "User already registered" — they may be re-registering after a failed attempt
      const isExistingUser =
        signUpError?.message?.toLowerCase().includes('already registered') ||
        signUpError?.message?.toLowerCase().includes('already exists') ||
        signUpError?.status === 400;

      if (signUpError && !isExistingUser) {
        console.error('[sendEmailOtp] signUp error:', signUpError);
        return {
          error: {
            ...signUpError,
            message:
              signUpError.message ||
              'Failed to create account. Please try again.',
          },
        };
      }
    }

    // ── SEND OTP (works for both new and existing users) ────────────────────
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }, // user already exists at this point
    });

    if (error) {
      console.error('[sendEmailOtp] OTP send error:', error);
    }

    const normalisedError = error
      ? {
          ...error,
          message:
            error.message ||
            error.error_description ||
            error.msg ||
            (typeof error === 'string' ? error : JSON.stringify(error)) ||
            'Unknown error — check browser console for details',
        }
      : null;

    return { error: normalisedError };
  };

  /**
   * Verify the 6-digit email OTP.
   * If isRegister=true and the user is new, a profile row is created.
   * @param {string}  email      - email address
   * @param {string}  token      - 6-digit code
   * @param {boolean} isRegister - true for new staff self-registration
   * @param {object}  userData   - { fullName, department } for profile creation
   */
  const verifyEmailOtp = async (email, token, isRegister = false, userData = {}) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (!error && data?.user && isRegister) {
      // Check if a profile already exists (handles re-verification edge case)
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!existing) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: userData.fullName || '',
          // Store the college email in the profile for records/display.
          // `email` param here is the personal email (Supabase auth identity).
          // userData.collegeEmail holds the @velalarengg.ac.in address.
          email: userData.collegeEmail || email,
          department: userData.department || '',
          role: 'STAFF',
        });
      }
    }
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  // ── Derived helpers ───────────────────────────────────────────────────────
  const isAdmin = () => profile?.role === 'ADMIN';
  const isAuthenticated = () => !!user && !!profile;

  const mergedUser = profile
    ? {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        department: profile.department,
        role: profile.role,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user: mergedUser,
        supabaseUser: user,
        profile,
        loading,
        sendEmailOtp,
        verifyEmailOtp,
        logout,
        isAdmin,
        isAuthenticated,
        // Legacy stubs — kept to avoid any stale import errors
        login: () => {},
        token: user ? 'supabase-session' : null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
