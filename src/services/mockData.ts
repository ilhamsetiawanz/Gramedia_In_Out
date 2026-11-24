import type { Employee, InOutLog, DailyWorkLog } from '../types';
import { getTodayDateString } from '../utils/dateUtils';

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    nik: 'NIK-1001',
    nip: 'NIK-1001',
    name: 'Ahmad Rizal',
    department: 'SOA',
    max_break_minutes: 60,
    status: 'active',
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'emp-2',
    nik: 'NIK-1002',
    nip: 'NIK-1002',
    name: 'Budi Santoso',
    department: 'SOA',
    max_break_minutes: 60,
    status: 'active',
    created_at: '2026-01-11T08:00:00Z',
  },
  {
    id: 'emp-3',
    nik: 'NIK-2001',
    nip: 'NIK-2001',
    name: 'Siti Rahmawati',
    department: 'COUNTER - MG',
    max_break_minutes: 60,
    status: 'active',
    created_at: '2026-01-12T08:00:00Z',
  },
  {
    id: 'emp-4',
    nik: 'NIK-2002',
    nip: 'NIK-2002',
    name: 'Dewi Lestari',
    department: 'COUNTER - JETE',
    max_break_minutes: 45,
    status: 'active',
    created_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 'emp-5',
    nik: 'NIK-2003',
    nip: 'NIK-2003',
    name: 'Rian Pratama',
    department: 'COUNTER - ALFALINK',
    max_break_minutes: 60,
    status: 'active',
    created_at: '2026-02-01T08:00:00Z',
  },
  {
    id: 'emp-6',
    nik: 'NIK-2004',
    nip: 'NIK-2004',
    name: 'Maya Anggraini',
    department: 'COUNTER - THOMAS',
    max_break_minutes: 45,
    status: 'active',
    created_at: '2026-02-10T08:00:00Z',
  },
  {
    id: 'emp-7',
    nik: 'NIK-2005',
    nip: 'NIK-2005',
    name: 'Hendra Wijaya',
    department: 'COUNTER - CONSINA',
    max_break_minutes: 60,
    status: 'active',
    created_at: '2026-02-15T08:00:00Z',
  },
  {
    id: 'emp-8',
    nik: 'NIK-2006',
    nip: 'NIK-2006',
    name: 'Dian Permana',
    department: 'COUNTER - PROMEX',
    max_break_minutes: 60,
    status: 'active',
    created_at: '2026-02-20T08:00:00Z',
  },
];

export function getInitialWorkLogs(): DailyWorkLog[] {
  const today = getTodayDateString();
  return [
    {
      id: 'work-1',
      employee_id: 'emp-1',
      date: today,
      shift_start: '08:00',
      shift_end: null,
      status: 'working',
    },
    {
      id: 'work-2',
      employee_id: 'emp-2',
      date: today,
      shift_start: '08:15',
      shift_end: null,
      status: 'working',
    },
    {
      id: 'work-3',
      employee_id: 'emp-3',
      date: today,
      shift_start: '08:05',
      shift_end: null,
      status: 'working',
    },
    {
      id: 'work-4',
      employee_id: 'emp-4',
      date: today,
      shift_start: '08:30',
      shift_end: null,
      status: 'out_break',
    },
    {
      id: 'work-5',
      employee_id: 'emp-5',
      date: today,
      shift_start: '09:00',
      shift_end: null,
      status: 'working',
    },
    {
      id: 'work-6',
      employee_id: 'emp-6',
      date: today,
      shift_start: '08:00',
      shift_end: null,
      status: 'working',
    },
    {
      id: 'work-7',
      employee_id: 'emp-7',
      date: today,
      shift_start: '08:20',
      shift_end: null,
      status: 'working',
    },
  ];
}

export function getInitialInOutLogs(): InOutLog[] {
  const today = getTodayDateString();
  return [
    {
      id: 'log-1',
      employee_id: 'emp-1',
      date: today,
      time_out: '12:00',
      time_in: '12:50',
      duration_minutes: 50,
      purpose: 'Istirahat',
      notes: 'Makan siang kantin',
      is_overdue: false,
      created_at: `${today}T12:00:00Z`,
    },
    {
      id: 'log-2',
      employee_id: 'emp-3',
      date: today,
      time_out: '12:15',
      time_in: '13:30',
      duration_minutes: 75,
      purpose: 'Istirahat',
      notes: 'Istirahat makan siang counter',
      is_overdue: true, // 75 mins > 60 mins limit
      created_at: `${today}T12:15:00Z`,
    },
    {
      id: 'log-3',
      employee_id: 'emp-4',
      date: today,
      time_out: '12:05',
      time_in: null, // Masih di luar
      duration_minutes: null,
      purpose: 'Istirahat',
      notes: 'Istirahat counter JETE',
      is_overdue: false,
      created_at: `${today}T12:05:00Z`,
    },
  ];
}
