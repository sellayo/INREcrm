'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export type UserRole = 'sales' | 'internal' | 'admin' | null;
export type UserStatus = 'pending' | 'approved' | 'rejected' | null;

interface AuthContextType {
  role: UserRole;
  status: UserStatus;
  user: User | null;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);
  const [status, setStatus] = useState<UserStatus>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const fetchUserData = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setRole(data.role as UserRole);
      setStatus(data.status as UserStatus || 'approved'); // Fallback to approved for old records without status
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserData(session.user.id);
      } else {
        setRole(null);
        setStatus(null);
        setIsLoading(false);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserData(session.user.id);
      } else {
        setRole(null);
        setStatus(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!user && pathname !== '/') {
      router.push('/');
    } else if (user) {
      if ((status === 'pending' || status === 'rejected') && pathname !== '/pending') {
        router.push('/pending');
      } else if (status === 'approved') {
        if (pathname === '/' || pathname === '/pending') {
          router.push('/dashboard');
        }
      }
    }
  }, [user, status, isLoading, pathname, router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ role, status, user, logout, isAuthenticated: !!user, isSidebarCollapsed, toggleSidebar, isLoading }}>
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
