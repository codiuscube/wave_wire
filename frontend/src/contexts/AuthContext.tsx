import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Combined loading state - true until both auth AND profile are loaded
  const loading = isLoadingAuth || isLoadingProfile;

  // Fetch admin status from profiles table
  const fetchAdminStatus = useCallback(async (userId: string) => {
    setIsLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
        setIsAdmin(false);
      } else {
        setIsAdmin(data?.is_admin ?? false);
      }
    } catch (err) {
      console.error('Error fetching admin status:', err);
      setIsAdmin(false);
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

      // If no user, we're done loading profile too
      if (!session?.user) {
        setIsLoadingProfile(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoadingAuth(false);

        // If user signed out, reset profile loading
        if (!session?.user) {
          setIsLoadingProfile(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch admin status when user changes
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    fetchAdminStatus(user.id);
  }, [user, fetchAdminStatus]);

  // Email OTP (magic link) - sends a code to email
  const signInWithEmailOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Use OTP code instead of magic link for better UX
        shouldCreateUser: true,
      },
    });
    return { error: error as Error | null };
  };

  // Verify email OTP code
  const verifyEmailOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { error: error as Error | null };
  };

  // Password reset - sends reset email
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };

  // Update password (after reset link clicked)
  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error: error as Error | null };
  };

  // Send OTP to phone number
  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });
    return { error: error as Error | null };
  };

  // Verify OTP and create session
  const verifyOtp = async (phone: string, otp: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });

    if (error) {
      return { error: error as Error | null };
    }

    // Check if this is a new user (no email set yet)
    const isNewUser = !data.user?.email;

    return { error: null, isNewUser };
  };

  // Update user's email after phone verification
  const updateEmail = async (email: string) => {
    const { error } = await supabase.auth.updateUser({
      email,
    });
    return { error: error as Error | null };
  };

  // Legacy email/password signup
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  // Legacy email/password signin
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isAdmin,
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
    }}>
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
