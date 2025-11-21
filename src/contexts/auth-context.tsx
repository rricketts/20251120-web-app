import type { User, Session } from '@supabase/supabase-js';

import { useMemo, useState, useEffect, useContext, createContext } from 'react';

import { supabase } from 'src/lib/supabase';
import { type UserData, getUserDataByEmail } from 'src/lib/user-role';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string;
  userData: UserData | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('viewer');
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const updateLastLogin = async (userId: string) => {
      try {
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', userId);
      } catch (error) {
        console.error('Error updating last login:', error);
      }
    };

    const initAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user?.email) {
        const data = await getUserDataByEmail(currentSession.user.email);
        console.log('Auth Context - initAuth - userData:', data, 'role:', data?.role);
        setUserData(data);
        setUserRole(data?.role || 'viewer');

        if (currentSession.user.id) {
          await updateLastLogin(currentSession.user.id);
        }
      }

      setLoading(false);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user?.email) {
        const data = await getUserDataByEmail(currentSession.user.email);
        console.log('Auth Context - onAuthStateChange - event:', event, 'userData:', data, 'role:', data?.role);
        setUserData(data);
        setUserRole(data?.role || 'viewer');

        if (event === 'SIGNED_IN' && currentSession.user.id) {
          await updateLastLogin(currentSession.user.id);
        }
      } else {
        setUserRole('viewer');
        setUserData(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      userRole,
      userData,
      signIn,
      signUp,
      signOut,
    }),
    [user, session, loading, userRole, userData]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
