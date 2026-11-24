import type { Employee, InOutLog, DailyWorkLog } from '../types';

// Data default kosong (tidak ada data dummy)
export const INITIAL_EMPLOYEES: Employee[] = [];

export function getInitialWorkLogs(): DailyWorkLog[] {
  return [];
}

export function getInitialInOutLogs(): InOutLog[] {
  return [];
}
