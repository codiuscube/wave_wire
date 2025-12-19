import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/mappers';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null; // Added profile
  loading: boolean;
  isAdmin: boolean;
  // Email OTP (magic link) auth - PREFERRED
  signInWithEmailOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  // Password reset
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  // Phone auth methods (Twilio pending)
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ error: Error | null; isNewUser?: boolean }>;
  updateEmail: (email: string) => Promise<{ error: Error | null }>;
  // Legacy email/password methods
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false); // Changed default to false, set to true only when fetching

  const isAdmin = profile?.isAdmin ?? false;

  // Combined loading state - true until both auth AND profile are loaded
  const loading = isLoadingAuth || (!!user && !profile && isLoadingProfile);

  // Fetch full profile
  const fetchProfile = useCallback(async (userId: string) => {
    setIsLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
        setProfile(null);
      } else if (data) {
        // Import mapProfile is needed here, need to check imports
        const { mapProfile } = await import('../lib/mappers');
        setProfile(mapProfile(data));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoadingAuth(false);

      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoadingAuth(false);

        if (session?.user) {
          // Only fetch if we don't have it or if user changed
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Use refs or stable references for auth functions if they don't depend on state, 
  // but most supabase auth methods are stable. 
  // We will memoize the context value object.

  // Email OTP (magic link) - sends a code to email
  const signInWithEmailOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return { error: error as Error | null };
  }, []);

  // Verify email OTP code
  const verifyEmailOtp = useCallback(async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { error: error as Error | null };
  }, []);

  // Password reset - sends reset email
  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  }, []);

  // Update password (after reset link clicked)
  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error: error as Error | null };
  }, []);

  // Send OTP to phone number
  const signInWithPhone = useCallback(async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error: error as Error | null };
  }, []);

  // Verify OTP and create session
  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });

    if (error) {
      return { error: error as Error | null };
    }

    const isNewUser = !data.user?.email;
    return { error: null, isNewUser };
  }, []);

  // Update user's email after phone verification
  const updateEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.updateUser({ email });
    return { error: error as Error | null };
  }, []);

  // Legacy email/password signup
  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  }, []);

  // Legacy email/password signin
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    isAdmin,
    profile, // Exposed profile
    signInWithEmailOtp,
    verifyEmailOtp,
    resetPassword,
    updatePassword,
    signInWithPhone,
    verifyOtp,
    updateEmail,
    signUp,
    signIn,
    signOut,
    refreshProfile: () => user ? fetchProfile(user.id) : Promise.resolve(),
  }), [
    user, session, loading, isAdmin, profile,
    signInWithEmailOtp, verifyEmailOtp, resetPassword, updatePassword,
    signInWithPhone, verifyOtp, updateEmail, signUp, signIn, signOut
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
