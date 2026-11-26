import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import type { AdminUser } from '../types';

const ADMIN_STORAGE_KEY = 'gramedia_admin_user';

export const DEFAULT_ADMIN: AdminUser = {
  id: 'admin-kendari',
  email: 'kendari.gramediakendari.vm@gmail.com',
  name: 'Admin Gramedia Kendari',
  role: 'superadmin',
};

export async function loginAdmin(email: string, password: string): Promise<AdminUser> {
  const supabase = getSupabaseClient();
  const trimmedEmail = email.trim();

  // 1. Prioritaskan Autentikasi Langsung ke Supabase Auth
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        // Tampilkan pesan kesalahan asli dari Supabase
        console.error('Supabase auth error:', error);
        throw new Error(
          error.message === 'Invalid login credentials'
            ? 'Email atau kata sandi Supabase tidak sesuai.'
            : error.message
        );
      }

      if (data && data.user) {
        const user: AdminUser = {
          id: data.user.id,
          email: data.user.email || trimmedEmail,
          name: data.user.user_metadata?.name || 'Admin Gramedia Kendari',
          role: 'superadmin',
        };
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(user));
        return user;
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Gagal melakukan autentikasi dengan server Supabase.');
    }
  }

  // 2. Fallback jika Supabase offline / tidak terhubung
  if (
    (trimmedEmail.toLowerCase() === 'kendari.gramediakendari.vm@gmail.com' && password === 'Gramedia123') ||
    (trimmedEmail.toLowerCase() === 'admin@gramedia.com' && password === 'admin123')
  ) {
    const user: AdminUser = {
      id: 'local-admin',
      email: trimmedEmail,
      name: 'Admin Gramedia Kendari',
      role: 'superadmin',
    };
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(user));
    return user;
  }

  throw new Error('Email atau kata sandi tidak valid. Gunakan akun Supabase: kendari.gramediakendari.vm@gmail.com');
}

export function getCurrentAdmin(): AdminUser | null {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function verifyAdminPassword(email: string, password: string): Promise<boolean> {
  const trimmedEmail = email.trim();
  if (!password) {
    throw new Error('Silakan masukkan kata sandi akun untuk melanjutkan.');
  }

  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      throw new Error('Kata sandi akun tidak sesuai. Penghapusan data dibatalkan.');
    }

    if (data && data.user) {
      return true;
    }
  }

  // Fallback jika Supabase offline
  if (
    (trimmedEmail.toLowerCase() === 'kendari.gramediakendari.vm@gmail.com' && password === 'Gramedia123') ||
    (trimmedEmail.toLowerCase() === 'admin@gramedia.com' && password === 'admin123')
  ) {
    return true;
  }

  throw new Error('Kata sandi akun tidak sesuai. Penghapusan data dibatalkan.');
}

export async function logoutAdmin(): Promise<void> {
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signout failed', e);
    }
  }
  localStorage.removeItem(ADMIN_STORAGE_KEY);
}
