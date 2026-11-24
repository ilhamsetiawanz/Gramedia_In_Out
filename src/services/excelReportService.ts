import * as XLSX from 'xlsx';
import type { Employee, DailyWorkLog, InOutLog } from '../types';
import { formatDuration } from '../utils/dateUtils';

interface GenerateMonthlyExcelOptions {
  yearMonth: string; // YYYY-MM
  employees: Employee[];
  workLogs: DailyWorkLog[];
  inOutLogs: InOutLog[];
}

export function generateMonthlyExcelReport({
  yearMonth,
  employees,
  workLogs,
  inOutLogs,
}: GenerateMonthlyExcelOptions) {
  const empMap = new Map(employees.map((e) => [e.id, e]));

  // Nama bulan bahasa Indonesia
  const [yearStr, monthStr] = yearMonth.split('-');
  const monthNum = parseInt(monthStr, 10);
  const monthsIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthName = monthsIndo[monthNum - 1] || monthStr;
  const periodLabel = `${monthName} ${yearStr}`;

  // ================= SHEET 1: REKAP PRESENSI & SHIFT =================
  const attendanceRows = workLogs.map((log, index) => {
    const emp = empMap.get(log.employee_id) || log.employee;
    let statusDisplay = 'Bekerja';
    if (log.status === 'completed') statusDisplay = 'Selesai Shift';
    else if (log.status === 'leave') statusDisplay = 'Cuti/Izin';

    return {
      'No': index + 1,
      'Tanggal': log.date,
      'NIK': emp?.nik || emp?.nip || '-',
      'Nama Karyawan': emp?.name || 'Karyawan',
      'Departemen': emp?.department || '-',
      'Shift Kerja': log.shift_name || log.notes || 'Shift Pagi',
      'Jam Masuk (Clock In)': log.shift_start || '-',
      'Jam Pulang (Clock Out)': log.shift_end || '-',
      'Status Kehadiran': statusDisplay,
    };
  });

  // Jika belum ada presensi di bulan tersebut
  const attendanceData = attendanceRows.length > 0 ? attendanceRows : [{
    'No': 1,
    'Tanggal': `${yearMonth}-01`,
    'NIK': '-',
    'Nama Karyawan': 'Belum ada data presensi pada bulan ini',
    'Departemen': '-',
    'Shift Kerja': '-',
    'Jam Masuk (Clock In)': '-',
    'Jam Pulang (Clock Out)': '-',
    'Status Kehadiran': '-',
  }];

  const wsAttendance = XLSX.utils.json_to_sheet(attendanceData);
  // Atur lebar kolom untuk Sheet 1
  wsAttendance['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // Tanggal
    { wch: 16 }, // NIK
    { wch: 28 }, // Nama
    { wch: 24 }, // Departemen
    { wch: 18 }, // Shift Kerja
    { wch: 22 }, // Jam Masuk
    { wch: 22 }, // Jam Pulang
    { wch: 20 }, // Status Kehadiran
  ];

  // ================= SHEET 2: LOG KELUAR MASUK & ISTIRAHAT =================
  const inOutRows = inOutLogs.map((log, index) => {
    const emp = empMap.get(log.employee_id) || log.employee;
    const maxBreak = emp?.max_break_minutes || 60;
    const duration = log.duration_minutes !== null ? log.duration_minutes : 0;
    const isBreak = log.purpose === 'Istirahat';
    const isOverdue = isBreak && (log.is_overdue || (log.duration_minutes !== null && duration > maxBreak));
    const excess = Math.max(0, duration - maxBreak);

    let statusText = 'Tepat Waktu';
    if (!log.time_in) {
      statusText = 'Sedang Berada di Luar';
    } else if (isOverdue) {
      statusText = `[PERINGATAN] Melebihi Batas ${excess} Menit`;
    } else if (!isBreak) {
      statusText = 'Tugas Selesai';
    }

    return {
      'No': index + 1,
      'Tanggal': log.date,
      'NIK': emp?.nik || emp?.nip || '-',
      'Nama Karyawan': emp?.name || 'Karyawan',
      'Departemen': emp?.department || '-',
      'Keperluan': log.purpose,
      'Keterangan / Catatan': log.notes || '-',
      'Jam Keluar': log.time_out,
      'Jam Masuk': log.time_in || 'Belum Masuk',
      'Total Waktu': log.duration_minutes !== null ? formatDuration(log.duration_minutes) : 'Sedang Berjalan',
      'Batas Istirahat': isBreak ? `${maxBreak} Menit` : '-',
      'Status Kepatuhan': statusText,
    };
  });

  const inOutData = inOutRows.length > 0 ? inOutRows : [{
    'No': 1,
    'Tanggal': `${yearMonth}-01`,
    'NIK': '-',
    'Nama Karyawan': 'Belum ada catatan keluar masuk pada bulan ini',
    'Departemen': '-',
    'Keperluan': '-',
    'Keterangan / Catatan': '-',
    'Jam Keluar': '-',
    'Jam Masuk': '-',
    'Total Waktu': '-',
    'Batas Istirahat': '-',
    'Status Kepatuhan': '-',
  }];

  const wsInOut = XLSX.utils.json_to_sheet(inOutData);
  // Atur lebar kolom untuk Sheet 2
  wsInOut['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // Tanggal
    { wch: 16 }, // NIK
    { wch: 28 }, // Nama
    { wch: 24 }, // Departemen
    { wch: 18 }, // Keperluan
    { wch: 25 }, // Catatan
    { wch: 14 }, // Jam Keluar
    { wch: 14 }, // Jam Masuk
    { wch: 16 }, // Total Waktu
    { wch: 16 }, // Batas Istirahat
    { wch: 35 }, // Status Kepatuhan
  ];

  // ================= WORKBOOK =================
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsAttendance, 'Rekap Presensi & Shift');
  XLSX.utils.book_append_sheet(workbook, wsInOut, 'Log Keluar Masuk & Istirahat');

  // Trigger download file
  const filename = `Rekap_Presensi_Gramedia_${periodLabel.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
