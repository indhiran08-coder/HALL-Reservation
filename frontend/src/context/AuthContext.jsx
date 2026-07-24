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
  const sendEmailOtp = async (email, shouldCreateUser = false) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser },
    });

    if (error) {
      // Log full error so it's visible in browser DevTools → Console
      console.error('[sendEmailOtp] Supabase error:', error);
    }

    // Normalise: extract a readable message from any error shape Supabase returns
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
