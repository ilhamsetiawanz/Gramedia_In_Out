import React, { useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, X, RefreshCw, Copy, Check, ExternalLink } from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, resetSupabaseClient, isSupabaseConfigured } from '../../lib/supabase';

const SQL_SCHEMA_SCRIPT = `-- ====================================================================
-- SISTEM PENCATATAN JAM KELUAR MASUK KARYAWAN GRAMEDIA
-- Database Schema Supabase (PostgreSQL)
-- ====================================================================

-- 1. Tabel Karyawan (Employees)
-- Kolom: NIK, Nama, Departemen (SOA, COUNTER: MG, JETE, ALFALINK, THOMAS, CONSINA, PROMEX), Batas Istirahat
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nik VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    max_break_minutes INTEGER NOT NULL DEFAULT 60,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Presensi Kehadiran Harian (Daily Attendance & Clock In / Clock Out)
-- Jam masuk mengikuti waktu Clock In, jam keluar mengikuti waktu Clock Out
CREATE TABLE IF NOT EXISTS public.daily_work_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    shift_start TIME NOT NULL DEFAULT CURRENT_TIME, -- Jam Masuk (Clock In)
    shift_end TIME,                                 -- Jam Keluar (Clock Out)
    status VARCHAR(30) NOT NULL DEFAULT 'working' CHECK (status IN ('working', 'out_break', 'completed', 'leave')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (employee_id, date)
);

-- 3. Tabel Log Keluar Masuk (Istirahat & Izin Keluar)
CREATE TABLE IF NOT EXISTS public.in_out_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_out TIME NOT NULL,                         -- Jam Keluar
    time_in TIME,                                  -- Jam Masuk Kembali
    duration_minutes INTEGER,                       -- Total Waktu Keluar (menit)
    purpose VARCHAR(50) NOT NULL DEFAULT 'Istirahat', -- Istirahat, Antar Barang, Gudang, Lain - Lain, Ke Sekolah, Sebar Brosur, Pameran, Sholat, Toilet, Tukar Uang, dll.
    notes TEXT,
    is_overdue BOOLEAN NOT NULL DEFAULT false,      -- Warning jika melebihi batas istirahat
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_employees_nik ON public.employees(nik);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_in_out_logs_date ON public.in_out_logs(date);
CREATE INDEX IF NOT EXISTS idx_in_out_logs_emp ON public.in_out_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_daily_work_logs_date ON public.daily_work_logs(date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_out_logs ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses (Policy) untuk aplikasi web
CREATE POLICY "Akses Penuh Karyawan" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Presensi Harian" ON public.daily_work_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Log Keluar Masuk" ON public.in_out_logs FOR ALL USING (true) WITH CHECK (true);

-- Data Awal Karyawan SOA dan COUNTER
INSERT INTO public.employees (nik, name, department, max_break_minutes, status)
VALUES 
    ('NIK-1001', 'Ahmad Rizal', 'SOA', 60, 'active'),
    ('NIK-1002', 'Budi Santoso', 'SOA', 60, 'active'),
    ('NIK-2001', 'Siti Rahmawati', 'COUNTER - MG', 60, 'active'),
    ('NIK-2002', 'Dewi Lestari', 'COUNTER - JETE', 45, 'active'),
    ('NIK-2003', 'Rian Pratama', 'COUNTER - ALFALINK', 60, 'active'),
    ('NIK-2004', 'Maya Anggraini', 'COUNTER - THOMAS', 45, 'active'),
    ('NIK-2005', 'Hendra Wijaya', 'COUNTER - CONSINA', 60, 'active'),
    ('NIK-2006', 'Dian Permana', 'COUNTER - PROMEX', 60, 'active')
ON CONFLICT (nik) DO NOTHING;
`;

interface SupabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [hasCopiedSql, setHasCopiedSql] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SCRIPT);
    setHasCopiedSql(true);
    setTimeout(() => setHasCopiedSql(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url, anonKey);
    resetSupabaseClient();
    setMessage({
      type: 'success',
      text: 'Konfigurasi Supabase berhasil disimpan. Sistem akan memuat data dari Supabase.',
    });
    setTimeout(() => {
      if (onSaved) onSaved();
      onClose();
    }, 1200);
  };

  const handleResetToLocal = () => {
    setUrl('');
    setAnonKey('');
    saveSupabaseConfig('', '');
    resetSupabaseClient();
    setMessage({
      type: 'info',
      text: 'Beralih ke mode penyimpanan lokal (LocalStorage).',
    });
    setTimeout(() => {
      if (onSaved) onSaved();
      onClose();
    }, 1000);
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Database className="w-5 h-5 text-blue-200" />
            <h3 className="font-semibold text-base">Konfigurasi Database Supabase</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Sistem ini dapat menggunakan database Supabase langsung atau penyimpanan lokal (offline-first).
            Masukkan <strong>Project URL</strong> dan <strong>Anon Public Key</strong> dari Supabase Dashboard Anda.
          </p>

          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
            <div className="flex items-center text-slate-700 font-medium">
              <span className="w-2 h-2 rounded-full mr-2 bg-blue-600"></span>
              Status Saat Ini:{' '}
              <span className={`ml-1 font-semibold ${isConfigured ? 'text-green-700' : 'text-amber-700'}`}>
                {isConfigured ? 'Terhubung ke Supabase' : 'Mode Penyimpanan Lokal (Demo)'}
              </span>
            </div>
            <p className="text-slate-500">
              Buat tabel di Supabase dengan menjalankan skrip SQL di <strong>SQL Editor</strong> dashboard Supabase Anda.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-semibold transition-colors cursor-pointer"
              >
                {hasCopiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-green-600" />
                    <span className="text-green-700">Skrip SQL Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    <span>Salin Skrip SQL Tabel</span>
                  </>
                )}
              </button>
              <a
                href="https://supabase.com/dashboard/project/ojkypldccqkmevdgqhpi/sql/new"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-2.5 py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1 text-blue-600" />
                Buka SQL Editor Supabase
              </a>
            </div>
          </div>

          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-xs flex items-start space-x-2 border ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border-green-200'
                  : message.type === 'error'
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project URL (VITE_SUPABASE_URL)
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Anon Public Key (VITE_SUPABASE_ANON_KEY)
              </label>
              <textarea
                rows={3}
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetToLocal}
                className="text-xs text-slate-600 hover:text-slate-800 font-medium py-1.5 px-2 rounded hover:bg-slate-100 flex items-center cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Gunakan Mode Lokal
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg border border-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Simpan Konfigurasi
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
