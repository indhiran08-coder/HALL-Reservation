import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Supabase auth user
  const [profile, setProfile] = useState(null); // Our profiles table row
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // Listen for login/logout changes
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
   * Send SMS OTP to a phone number.
   * Works for both login and registration (staff).
   * Phone must be in E.164 format, e.g. +919876543210
   */
  const sendPhoneOtp = async (phone) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: true,
      },
    });
    return { error };
  };

  /**
   * Verify the 6-digit SMS OTP (staff login / registration).
   * @param {string} phone  - E.164 phone number
   * @param {string} token  - 6-digit code from SMS
   * @param {boolean} isRegister - true if this is a new registration
   * @param {object} userData    - { fullName, department, email, phone } for new profile creation
   */
  const verifyPhoneOtp = async (phone, token, isRegister = false, userData = {}) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (!error && data?.user) {
      // Check if a profile already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!existing && isRegister) {
        // First-time registration — create the profile row
        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: userData.fullName || '',
          email: userData.email || '',
          department: userData.department || '',
          phone: phone,
          role: 'STAFF',
        });
      }
    }
    return { error };
  };

  /**
   * Send email magic-link / OTP to an admin's email address.
   * Admin accounts are pre-created in Supabase Auth → Users.
   * shouldCreateUser: false ensures only existing admin accounts can sign in.
   */
  const sendEmailOtp = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // admins must already exist — no self-registration
      },
    });
    return { error };
  };

  /**
   * Verify the 6-digit email OTP (admin login).
   * @param {string} email - admin email address
   * @param {string} token - 6-digit code from email
   */
  const verifyEmailOtp = async (email, token) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
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

  // Provide a unified `user` shape that the existing pages expect
  const mergedUser = profile
    ? {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        department: profile.department,
        phone: profile.phone,
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
        sendPhoneOtp,
        verifyPhoneOtp,
        sendEmailOtp,
        verifyEmailOtp,
        logout,
        isAdmin,
        isAuthenticated,
        // Legacy compat stubs
        login: () => {},
        token: user ? 'supabase-session' : null,
        sendLoginOtp: sendPhoneOtp,
        sendRegisterOtp: sendPhoneOtp,
        verifyOtp: () => Promise.resolve({ error: new Error('Use verifyPhoneOtp or verifyEmailOtp') }),
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
