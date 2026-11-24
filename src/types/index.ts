export type EmployeeStatus = 'active' | 'inactive';

export interface Employee {
  id: string;
  nik: string; // Nomor Induk Karyawan
  nip?: string; // Kompatibilitas
  name: string;
  department: string; // SOA, COUNTER - MG, COUNTER - JETE, dll.
  position?: string;
  phone?: string;
  max_break_minutes: number;
  status: EmployeeStatus;
  created_at?: string;
}

export type InOutPurpose = 'Istirahat' | 'Tugas Luar' | 'Keperluan Pribadi' | 'Medis' | 'Lainnya';

export interface InOutLog {
  id: string;
  employee_id: string;
  employee?: Employee;
  date: string; // YYYY-MM-DD
  time_out: string; // HH:mm or HH:mm:ss
  time_in: string | null; // null if currently outside
  duration_minutes: number | null;
  purpose: InOutPurpose;
  notes?: string;
  is_overdue: boolean;
  created_at?: string;
}

export type WorkStatus = 'working' | 'out_break' | 'completed' | 'leave';

export type ShiftType = 'Shift Pagi' | 'Shift Middle' | 'Shift Siang' | string;

export interface DailyWorkLog {
  id: string;
  employee_id: string;
  employee?: Employee;
  date: string; // YYYY-MM-DD
  shift_name?: string; // Shift Pagi, Shift Middle, Shift Siang
  shift_start: string; // Jam Clock In
  shift_end: string | null; // Jam Clock Out
  status: WorkStatus;
  notes?: string;
  created_at?: string;
}

export interface DashboardStats {
  totalEmployees: number;
  workingToday: number;
  currentlyOut: number;
  overdueBreaksCount: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin';
}
