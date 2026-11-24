import type { Employee, InOutLog, DailyWorkLog, InOutPurpose, WorkStatus } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_EMPLOYEES, getInitialWorkLogs, getInitialInOutLogs } from './mockData';
import { calculateMinutesDiff, getTodayDateString, getCurrentTimeString } from '../utils/dateUtils';

const STORAGE_KEY_EMPLOYEES = 'gramedia_employees';
const STORAGE_KEY_INOUT = 'gramedia_inout_logs';
const STORAGE_KEY_WORKLOGS = 'gramedia_work_logs';

// Helper local storage
function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading localStorage', key, e);
    return fallback;
  }
}

function saveLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed saving localStorage', key, e);
  }
}

// Inisialisasi local storage & pembersihan data dummy
export function initializeStorage() {
  try {
    // Bersihkan data dummy lama (Budi Santoso, emp-1, GRM-xxx) jika ada di localStorage
    const rawEmp = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
    if (rawEmp && (rawEmp.includes('emp-1') || rawEmp.includes('GRM-') || rawEmp.includes('Budi Santoso'))) {
      localStorage.removeItem(STORAGE_KEY_EMPLOYEES);
      localStorage.removeItem(STORAGE_KEY_WORKLOGS);
      localStorage.removeItem(STORAGE_KEY_INOUT);
    }
  } catch (e) {
    console.warn('Gagal membersihkan data dummy lama', e);
  }

  if (!localStorage.getItem(STORAGE_KEY_EMPLOYEES)) {
    saveLocal(STORAGE_KEY_EMPLOYEES, INITIAL_EMPLOYEES);
  }
  if (!localStorage.getItem(STORAGE_KEY_WORKLOGS)) {
    saveLocal(STORAGE_KEY_WORKLOGS, getInitialWorkLogs());
  }
  if (!localStorage.getItem(STORAGE_KEY_INOUT)) {
    saveLocal(STORAGE_KEY_INOUT, getInitialInOutLogs());
  }
}

// ================= EMPLOYEES =================
export async function getEmployees(): Promise<Employee[]> {
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data) {
        return data.map((item) => ({
          ...item,
          nik: item.nik || item.nip || '-',
          nip: item.nik || item.nip || '-',
        })) as Employee[];
      }
    } catch (e) {
      console.warn('Supabase fetch failed, fallback to local', e);
    }
  }

  // Fallback local bersih
  initializeStorage();
  const local = loadLocal<Employee[]>(STORAGE_KEY_EMPLOYEES, []);
  return local.map((item) => ({
    ...item,
    nik: item.nik || item.nip || '-',
    nip: item.nik || item.nip || '-',
  }));
}

export async function addEmployee(employee: Omit<Employee, 'id' | 'created_at'>): Promise<Employee> {
  const newId = `emp-${Date.now()}`;
  const nikVal = employee.nik || employee.nip || `NIK-${Math.floor(1000 + Math.random() * 9000)}`;
  const newRecord: Employee = {
    ...employee,
    id: newId,
    nik: nikVal,
    nip: nikVal,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          nik: nikVal,
          name: employee.name,
          department: employee.department,
          max_break_minutes: employee.max_break_minutes,
          status: employee.status,
        }])
        .select()
        .single();
      if (!error && data) {
        const fullData: Employee = {
          ...data,
          nik: data.nik || nikVal,
          nip: data.nik || nikVal,
        };
        const local = loadLocal<Employee[]>(STORAGE_KEY_EMPLOYEES, []);
        saveLocal(STORAGE_KEY_EMPLOYEES, [fullData, ...local]);
        return fullData;
      }
    } catch (e) {
      console.warn('Supabase insert failed, saving to local', e);
    }
  }

  // Local fallback
  const local = loadLocal<Employee[]>(STORAGE_KEY_EMPLOYEES, []);
  const updated = [newRecord, ...local];
  saveLocal(STORAGE_KEY_EMPLOYEES, updated);
  return newRecord;
}

export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        return data as Employee;
      }
    } catch (e) {
      console.warn('Supabase update failed, updating local', e);
    }
  }

  const local = loadLocal<Employee[]>(STORAGE_KEY_EMPLOYEES, []);
  const updated = local.map((emp) => (emp.id === id ? { ...emp, ...updates } : emp));
  saveLocal(STORAGE_KEY_EMPLOYEES, updated);
  const found = updated.find((e) => e.id === id);
  if (!found) throw new Error('Employee not found');
  return found;
}

export async function deleteEmployee(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('employees').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete failed', e);
    }
  }

  const local = loadLocal<Employee[]>(STORAGE_KEY_EMPLOYEES, []);
  saveLocal(STORAGE_KEY_EMPLOYEES, local.filter((e) => e.id !== id));
  return true;
}

// ================= DAILY WORK LOGS (KEHADIRAN HARI INI & SHIFT) =================
export async function getDailyWorkLogs(dateStr: string = getTodayDateString()): Promise<DailyWorkLog[]> {
  const employees = await getEmployees();
  const empMap = new Map(employees.map((e) => [e.id, e]));

  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('daily_work_logs')
        .select('*')
        .eq('date', dateStr);
      if (!error && data) {
        return data.map((item) => ({
          ...item,
          shift_name: item.shift_name || item.notes || 'Shift Pagi',
          employee: empMap.get(item.employee_id),
        })) as DailyWorkLog[];
      }
    } catch (e) {
      console.warn('Supabase work logs fetch failed, fallback to local', e);
    }
  }

  // Local fallback
  initializeStorage();
  const allLogs = loadLocal<DailyWorkLog[]>(STORAGE_KEY_WORKLOGS, []);
  const filtered = allLogs.filter((l) => l.date === dateStr);
  return filtered.map((l) => ({
    ...l,
    shift_name: l.shift_name || l.notes || 'Shift Pagi',
    employee: empMap.get(l.employee_id),
  }));
}

export async function markEmployeeAttendance(
  employeeId: string,
  dateStr: string = getTodayDateString(),
  shiftName: string = 'Shift Pagi',
  shiftStart?: string,
  status: WorkStatus = 'working'
): Promise<DailyWorkLog> {
  const clockInTime = shiftStart || getCurrentTimeString(); // Otomatis waktu saat Clock In
  const newRecord: DailyWorkLog = {
    id: `work-${Date.now()}`,
    employee_id: employeeId,
    date: dateStr,
    shift_name: shiftName,
    shift_start: clockInTime,
    shift_end: null,
    status,
    notes: shiftName,
  };

  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    try {
      const payload: Record<string, unknown> = {
        employee_id: employeeId,
        date: dateStr,
        shift_start: clockInTime,
        status,
        notes: shiftName,
      };

      const { data, error } = await supabase
        .from('daily_work_logs')
        .upsert([payload], { onConflict: 'employee_id,date' })
        .select()
        .single();
      if (!error && data) {
        return {
          ...data,
          shift_name: data.shift_name || data.notes || shiftName,
        } as DailyWorkLog;
      }
    } catch (e) {
      console.warn('Supabase attendance failed, using local', e);
    }
  }

  // Local fallback
  const allLogs = loadLocal<DailyWorkLog[]>(STORAGE_KEY_WORKLOGS, []);
  const existingIdx = allLogs.findIndex((l) => l.employee_id === employeeId && l.date === dateStr);
  if (existingIdx >= 0) {
    allLogs[existingIdx] = { 
      ...allLogs[existingIdx], 
      status, 
      shift_start: clockInTime, 
      shift_name: shiftName,
      notes: shiftName 
    };
  } else {
    allLogs.push(newRecord);
  }
  saveLocal(STORAGE_KEY_WORKLOGS, allLogs);
  return newRecord;
}

export async function updateDailyWorkStatus(
  employeeId: string,
  status: WorkStatus,
  dateStr: string = getTodayDateString(),
  shiftEnd?: string
): Promise<void> {
  const clockOutTime = shiftEnd || (status === 'completed' ? getCurrentTimeString() : undefined);
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    try {
      const payload: Record<string, unknown> = { status };
      if (clockOutTime) payload.shift_end = clockOutTime;
      await supabase
        .from('daily_work_logs')
        .update(payload)
        .eq('employee_id', employeeId)
        .eq('date', dateStr);
    } catch (e) {
      console.warn('Supabase work status update failed', e);
    }
  }

  const allLogs = loadLocal<DailyWorkLog[]>(STORAGE_KEY_WORKLOGS, []);
  const idx = allLogs.findIndex((l) => l.employee_id === employeeId && l.date === dateStr);
  if (idx >= 0) {
    allLogs[idx].status = status;
    if (clockOutTime) allLogs[idx].shift_end = clockOutTime;
    saveLocal(STORAGE_KEY_WORKLOGS, allLogs);
  }
}

// ================= IN-OUT LOGS (KELUAR MASUK ISTIRAHAT) =================
function parsePurposeAndNotes(rawPurpose: string, rawNotes?: string | null): { purpose: InOutPurpose; notes: string } {
  if (rawNotes && rawNotes.startsWith('[Keperluan: ')) {
    const match = rawNotes.match(/^\[Keperluan:\s*([^\]]+)\](?:\s*(.*))?$/s);
    if (match) {
      return {
        purpose: match[1] as InOutPurpose,
        notes: (match[2] || '').trim(),
      };
    }
  }
  return {
    purpose: rawPurpose as InOutPurpose,
    notes: (rawNotes || '').trim(),
  };
}

export async function getInOutLogs(dateStr: string = getTodayDateString()): Promise<InOutLog[]> {
  const employees = await getEmployees();
  const empMap = new Map(employees.map((e) => [e.id, e]));

  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('in_out_logs')
        .select('*')
        .eq('date', dateStr)
        .order('time_out', { ascending: false });
      if (!error && data) {
        return data.map((item) => {
          const parsed = parsePurposeAndNotes(item.purpose, item.notes);
          return {
            ...item,
            purpose: parsed.purpose,
            notes: parsed.notes,
            employee: empMap.get(item.employee_id),
          };
        }) as InOutLog[];
      }
    } catch (e) {
      console.warn('Supabase in-out logs fetch failed, fallback to local', e);
    }
  }

  // Local fallback
  initializeStorage();
  const allLogs = loadLocal<InOutLog[]>(STORAGE_KEY_INOUT, []);
  const filtered = allLogs.filter((l) => l.date === dateStr);
  return filtered.map((l) => ({
    ...l,
    employee: empMap.get(l.employee_id),
  })).sort((a, b) => b.time_out.localeCompare(a.time_out));
}

export async function recordTimeOut(
  employeeId: string,
  purpose: InOutPurpose,
  timeOutStr: string = getCurrentTimeString(),
  notes: string = '',
  dateStr: string = getTodayDateString()
): Promise<InOutLog> {
  const employees = await getEmployees();
  const emp = employees.find((e) => e.id === employeeId);

  const newLog: InOutLog = {
    id: `inout-${Date.now()}`,
    employee_id: employeeId,
    employee: emp,
    date: dateStr,
    time_out: timeOutStr,
    time_in: null,
    duration_minutes: null,
    purpose,
    notes,
    is_overdue: false,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    try {
      let payload: Record<string, unknown> = {
        employee_id: employeeId,
        date: dateStr,
        time_out: timeOutStr,
        purpose,
        notes: notes.trim() || null,
        is_overdue: false,
      };

      let { data, error } = await supabase
        .from('in_out_logs')
        .insert([payload])
        .select()
        .single();

      // Jika database Supabase masih memiliki check constraint lama (code 23514)
      if (error && (error.code === '23514' || error.message?.includes('check constraint'))) {
        const encodedNotes = `[Keperluan: ${purpose}]${notes.trim() ? ' ' + notes.trim() : ''}`;
        payload = {
          ...payload,
          purpose: 'Lainnya',
          notes: encodedNotes,
        };
        const retry = await supabase
          .from('in_out_logs')
          .insert([payload])
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (!error && data) {
        await updateDailyWorkStatus(employeeId, 'out_break', dateStr);
        const parsed = parsePurposeAndNotes(data.purpose, data.notes);
        return { 
          ...data, 
          purpose: parsed.purpose, 
          notes: parsed.notes, 
          employee: emp 
        } as InOutLog;
      }
    } catch (e) {
      console.warn('Supabase record time out failed, using local', e);
    }
  }

  // Local fallback
  const allLogs = loadLocal<InOutLog[]>(STORAGE_KEY_INOUT, []);
  const updated = [newLog, ...allLogs];
  saveLocal(STORAGE_KEY_INOUT, updated);

  await updateDailyWorkStatus(employeeId, 'out_break', dateStr);
  return newLog;
}

export async function recordTimeIn(
  logId: string,
  timeInStr: string = getCurrentTimeString()
): Promise<InOutLog> {
  const employees = await getEmployees();
  const empMap = new Map(employees.map((e) => [e.id, e]));

  const allLogs = loadLocal<InOutLog[]>(STORAGE_KEY_INOUT, []);
  const target = allLogs.find((l) => l.id === logId);

  // Jika di supabase
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    try {
      // Ambil log dari supabase jika tidak ada di local
      const { data: dbLog } = await supabase.from('in_out_logs').select('*').eq('id', logId).single();
      const actualLog = dbLog || target;
      if (actualLog) {
        const parsed = parsePurposeAndNotes(actualLog.purpose, actualLog.notes);
        const emp = empMap.get(actualLog.employee_id);
        const maxBreak = emp ? emp.max_break_minutes : 60;
        const duration = calculateMinutesDiff(actualLog.time_out, timeInStr);
        const isOverdue = parsed.purpose === 'Istirahat' && duration > maxBreak;

        const { data, error } = await supabase
          .from('in_out_logs')
          .update({
            time_in: timeInStr,
            duration_minutes: duration,
            is_overdue: isOverdue,
          })
          .eq('id', logId)
          .select()
          .single();
        if (!error && data) {
          await updateDailyWorkStatus(actualLog.employee_id, 'working', actualLog.date);
          const parsedResult = parsePurposeAndNotes(data.purpose, data.notes);
          return { 
            ...data, 
            purpose: parsedResult.purpose, 
            notes: parsedResult.notes, 
            employee: emp 
          } as InOutLog;
        }
      }
    } catch (e) {
      console.warn('Supabase record time in failed, updating local', e);
    }
  }

  if (!target) throw new Error('Data keluar-masuk tidak ditemukan');

  const parsedTarget = parsePurposeAndNotes(target.purpose, target.notes);
  const emp = empMap.get(target.employee_id);
  const maxBreak = emp ? emp.max_break_minutes : 60;
  const duration = calculateMinutesDiff(target.time_out, timeInStr);
  const isOverdue = parsedTarget.purpose === 'Istirahat' && duration > maxBreak;

  const updatedLogs = allLogs.map((l) => {
    if (l.id === logId) {
      return {
        ...l,
        time_in: timeInStr,
        duration_minutes: duration,
        is_overdue: isOverdue,
      };
    }
    return l;
  });
  saveLocal(STORAGE_KEY_INOUT, updatedLogs);

  await updateDailyWorkStatus(target.employee_id, 'working', target.date);

  const updatedTarget = updatedLogs.find((l) => l.id === logId)!;
  return { ...updatedTarget, employee: emp };
}

export async function deleteInOutLog(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('in_out_logs').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete in-out log failed', e);
    }
  }

  const allLogs = loadLocal<InOutLog[]>(STORAGE_KEY_INOUT, []);
  saveLocal(STORAGE_KEY_INOUT, allLogs.filter((l) => l.id !== id));
  return true;
}

// ================= DATA BULANAN (UNTUK EXCEL 1 BULAN) =================
export async function getMonthlyRecords(yearMonth: string): Promise<{
  employees: Employee[];
  workLogs: DailyWorkLog[];
  inOutLogs: InOutLog[];
}> {
  const employees = await getEmployees();
  const empMap = new Map(employees.map((e) => [e.id, e]));

  const startDate = `${yearMonth}-01`;
  const endDate = `${yearMonth}-31`;

  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    try {
      const [workRes, inOutRes] = await Promise.all([
        supabase
          .from('daily_work_logs')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true }),
        supabase
          .from('in_out_logs')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true }),
      ]);

      const workData = (workRes.data || []).map((w) => ({
        ...w,
        shift_name: w.shift_name || w.notes || 'Shift Pagi',
        employee: empMap.get(w.employee_id),
      })) as DailyWorkLog[];

      const inOutData = (inOutRes.data || []).map((io) => {
        const parsed = parsePurposeAndNotes(io.purpose, io.notes);
        return {
          ...io,
          purpose: parsed.purpose,
          notes: parsed.notes,
          employee: empMap.get(io.employee_id),
        };
      }) as InOutLog[];

      return {
        employees,
        workLogs: workData,
        inOutLogs: inOutData,
      };
    } catch (e) {
      console.warn('Supabase monthly fetch failed, fallback to local', e);
    }
  }

  // Local fallback
  const allWorkLogs = loadLocal<DailyWorkLog[]>(STORAGE_KEY_WORKLOGS, []);
  const allInOutLogs = loadLocal<InOutLog[]>(STORAGE_KEY_INOUT, []);

  const monthWorkLogs = allWorkLogs
    .filter((l) => l.date.startsWith(yearMonth))
    .map((l) => ({
      ...l,
      shift_name: l.shift_name || l.notes || 'Shift Pagi',
      employee: empMap.get(l.employee_id),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const monthInOutLogs = allInOutLogs
    .filter((l) => l.date.startsWith(yearMonth))
    .map((l) => ({
      ...l,
      employee: empMap.get(l.employee_id),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    employees,
    workLogs: monthWorkLogs,
    inOutLogs: monthInOutLogs,
  };
}
