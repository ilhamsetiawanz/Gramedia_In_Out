import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AdminUser } from '../types';
import { getCurrentAdmin, loginAdmin, logoutAdmin } from '../services/authService';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const supabase = getSupabaseClient();
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            const user: AdminUser = {
              id: data.session.user.id,
              email: data.session.user.email || '',
              name: data.session.user.user_metadata?.name || 'Admin Gramedia Kendari',
              role: 'superadmin',
            };
            setAdmin(user);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Error reading Supabase session:', e);
        }
      }

      const saved = getCurrentAdmin();
      if (saved) {
        setAdmin(saved);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const user = await loginAdmin(email, pass);
    setAdmin(user);
  };

  const logout = async () => {
    await logoutAdmin();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
