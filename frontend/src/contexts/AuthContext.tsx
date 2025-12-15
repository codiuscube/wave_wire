import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  // Phone auth methods
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ error: Error | null; isNewUser?: boolean }>;
  updateEmail: (email: string) => Promise<{ error: Error | null }>;
  // Legacy email methods (kept for compatibility)
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// TODO: Replace with actual admin user IDs from Supabase or use a profiles table with is_admin column
// For development, check localStorage for admin mode toggle
const ADMIN_USER_IDS: string[] = [];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Check admin status when user changes
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    // Check if user ID is in admin list
    if (ADMIN_USER_IDS.includes(user.id)) {
      setIsAdmin(true);
      return;
    }

    // Development mode: check localStorage for admin toggle
    // This allows testing admin features without modifying the database
    // Remove this in production or replace with proper Supabase role check
    const devAdminMode = localStorage.getItem('homebreak_admin_mode') === 'true';
    setIsAdmin(devAdminMode);

    // TODO: For production, fetch admin status from Supabase profiles table:
    // const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    // setIsAdmin(data?.is_admin ?? false);
  }, [user]);

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
