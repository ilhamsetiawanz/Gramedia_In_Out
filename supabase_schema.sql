-- ====================================================================
-- SISTEM PENCATATAN JAM KELUAR MASUK KARYAWAN GRAMEDIA
-- Database Schema Supabase (PostgreSQL)
-- ====================================================================

-- 1. Hapus tabel lama jika ingin reset struktur (opsional)
-- DROP TABLE IF EXISTS public.in_out_logs CASCADE;
-- DROP TABLE IF EXISTS public.daily_work_logs CASCADE;
-- DROP TABLE IF EXISTS public.employees CASCADE;

-- 2. Tabel Karyawan (Employees)
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

-- 3. Tabel Presensi Kehadiran Harian (Daily Attendance & Clock In / Clock Out)
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

-- 4. Tabel Log Keluar Masuk (Istirahat & Izin Keluar)
CREATE TABLE IF NOT EXISTS public.in_out_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_out TIME NOT NULL,                         -- Jam Keluar
    time_in TIME,                                  -- Jam Masuk Kembali
    duration_minutes INTEGER,                       -- Total Waktu Keluar (menit)
    purpose VARCHAR(50) NOT NULL DEFAULT 'Istirahat' CHECK (purpose IN ('Istirahat', 'Tugas Luar', 'Keperluan Pribadi', 'Medis', 'Lainnya')),
    notes TEXT,
    is_overdue BOOLEAN NOT NULL DEFAULT false,      -- Warning jika melebihi batas istirahat
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing untuk kecepatan pencarian query
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

-- 5. Data Awal Karyawan (Sesuai Departemen SOA dan COUNTER)
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
