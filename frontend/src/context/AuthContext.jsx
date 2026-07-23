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

  /** Send OTP for login (user must already exist) */
  const sendLoginOtp = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    return { error };
  };

  /** Send OTP for registration (creates auth user, stores metadata) */
  const sendRegisterOtp = async ({ email, fullName, department }) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { full_name: fullName, department },
      },
    });
    return { error };
  };

  /** Verify OTP — works for both login & registration */
  const verifyOtp = async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (!error && data.user) {
      // Create profile if it doesn't exist yet (first-time registration)
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!existing) {
        const meta = data.user.user_metadata;
        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: meta?.full_name || '',
          email: data.user.email,
          department: meta?.department || '',
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

  // Provide a unified `user` shape that the existing pages expect
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
        sendLoginOtp,
        sendRegisterOtp,
        verifyOtp,
        logout,
        isAdmin,
        isAuthenticated,
        // Legacy compat for older pages
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
