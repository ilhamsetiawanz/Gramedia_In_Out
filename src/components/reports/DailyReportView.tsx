import React, { useState } from 'react';
import type { Employee, DailyWorkLog, InOutLog } from '../../types';
import { 
  FileDown, 
  Calendar, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users 
} from 'lucide-react';
import { formatIndonesianDate, formatDuration } from '../../utils/dateUtils';
import { generateDailyPDFReport } from '../../services/pdfReportService';

interface DailyReportViewProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  employees: Employee[];
  workLogs: DailyWorkLog[];
  inOutLogs: InOutLog[];
  adminName?: string;
}

export const DailyReportView: React.FC<DailyReportViewProps> = ({
  selectedDate,
  onSelectDate,
  employees,
  workLogs,
  inOutLogs,
  adminName,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const empMap = new Map(employees.map((e) => [e.id, e]));

  // Break violations calculation
  const breakViolations = inOutLogs.filter((l) => {
    if (l.purpose !== 'Istirahat') return false;
    const emp = empMap.get(l.employee_id);
    const max = emp?.max_break_minutes || 60;
    return l.is_overdue || (l.duration_minutes !== null && l.duration_minutes > max);
  });

  const handleDownloadPDF = () => {
    try {
      setIsExporting(true);
      generateDailyPDFReport({
        date: selectedDate,
        employees,
        workLogs,
        inOutLogs,
        adminName,
      });
    } catch (e) {
      console.error('Error generating PDF:', e);
      alert('Gagal menghasilkan dokumen PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Laporan Administrasi & Rekapitulasi
          </div>
          <h2 className="text-xl font-bold text-[#1e293b] mt-0.5 flex items-center">
            <FileDown className="w-5 h-5 mr-2 text-blue-600" />
            Laporan Harian Presensi & Keluar Masuk
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Rekap kehadiran kerja harian, pergerakan keluar-masuk karyawan, dan catatan kepatuhan istirahat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 bg-slate-100 px-3 py-2 rounded-lg border border-slate-300 text-xs">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 mr-2" />
            {isExporting ? 'Menyiapkan PDF...' : 'Download Laporan PDF'}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Karyawan Terdaftar
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{employees.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Semua divisi</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            Hadir Bekerja
          </div>
          <div className="text-2xl font-bold text-blue-800 mt-1">{workLogs.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Shift aktif hari ini</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            Total Aktivitas Keluar
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{inOutLogs.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Log keluar kantor</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${
          breakViolations.length > 0 ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${
              breakViolations.length > 0 ? 'text-amber-800' : 'text-slate-500'
            }`}>
              Pelanggaran Istirahat
            </span>
            {breakViolations.length > 0 && <AlertTriangle className="w-4 h-4 text-amber-600" />}
          </div>
          <div className={`text-2xl font-bold mt-1 ${
            breakViolations.length > 0 ? 'text-amber-900' : 'text-slate-900'
          }`}>
            {breakViolations.length}
          </div>
          <div className={`text-xs mt-0.5 ${
            breakViolations.length > 0 ? 'text-amber-700 font-medium' : 'text-slate-400'
          }`}>
            {breakViolations.length > 0 ? 'Melebihi alokasi waktu' : 'Nihil pelanggaran'}
          </div>
        </div>
      </div>

      {/* Preview Section 1: Karyawan Bekerja Hari Ini */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center">
            <Users className="w-4 h-4 mr-2 text-blue-600" />
            1. Pratinjau Daftar Karyawan yang Bekerja Pada Hari Ini
          </h3>
          <span className="text-xs text-slate-500">
            {workLogs.length} dari {employees.length} karyawan presensi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-white text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-4 w-12 text-center">No</th>
                <th className="py-2.5 px-4">NIK & Nama</th>
                <th className="py-2.5 px-4">Departemen</th>
                <th className="py-2.5 px-4 text-center">Jam Masuk (Clock In)</th>
                <th className="py-2.5 px-4 text-center">Jam Pulang (Clock Out)</th>
                <th className="py-2.5 px-4 text-center">Status Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {employees.map((emp, index) => {
                const work = workLogs.find((w) => w.employee_id === emp.id);
                const isPresent = Boolean(work);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 text-center text-slate-400 font-mono">{index + 1}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {emp.name} <span className="font-mono text-slate-400 font-normal">({emp.nik || emp.nip})</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-medium">
                      {emp.department}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-800">
                      {isPresent ? work?.shift_start : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-800">
                      {isPresent ? (work?.shift_end || 'Sedang Bekerja') : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {isPresent ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          Hadir
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
                          Belum Hadir
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Section 2: Rincian Log Keluar Masuk & Warning */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-blue-600" />
            2. Pratinjau Rincian Jam Keluar Masuk & Peringatan Istirahat
          </h3>
          <span className="text-xs text-slate-500">
            {inOutLogs.length} catatan keluar masuk
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-white text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-4 w-12 text-center">No</th>
                <th className="py-2.5 px-4">Karyawan</th>
                <th className="py-2.5 px-4">Keperluan & Catatan</th>
                <th className="py-2.5 px-4 text-center">Jam Keluar</th>
                <th className="py-2.5 px-4 text-center">Jam Masuk</th>
                <th className="py-2.5 px-4 text-center">Total Durasi</th>
                <th className="py-2.5 px-4 text-center">Batas</th>
                <th className="py-2.5 px-4 text-center">Status Warning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {inOutLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    Tidak ada aktivitas keluar masuk pada tanggal {formatIndonesianDate(selectedDate)}.
                  </td>
                </tr>
              ) : (
                inOutLogs.map((log, index) => {
                  const emp = empMap.get(log.employee_id);
                  const maxBreak = emp?.max_break_minutes || 60;
                  const isBreak = log.purpose === 'Istirahat';
                  const isOverdue = isBreak && (log.is_overdue || (log.duration_minutes !== null && log.duration_minutes > maxBreak));
                  const excess = Math.max(0, (log.duration_minutes || 0) - maxBreak);

                  return (
                    <tr 
                      key={log.id} 
                      className={`hover:bg-slate-50/60 ${isOverdue ? 'bg-amber-50/40' : ''}`}
                    >
                      <td className="py-2.5 px-4 text-center text-slate-400 font-mono">{index + 1}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {emp?.name || 'Karyawan'} <span className="font-mono text-slate-400 font-normal">({emp?.nik || emp?.nip})</span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-medium text-slate-800">{log.purpose}</span>
                        {log.notes && <span className="text-slate-500 italic ml-1">({log.notes})</span>}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-slate-800">{log.time_out}</td>
                      <td className="py-2.5 px-4 text-center font-mono text-slate-800">{log.time_in || 'Belum Masuk'}</td>
                      <td className="py-2.5 px-4 text-center font-medium">
                        {log.duration_minutes !== null ? `${formatDuration(log.duration_minutes)}` : 'Sedang berjalan'}
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-600 font-mono">
                        {isBreak ? `${maxBreak} mnt` : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {isOverdue ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-600" />
                            Melebihi Batas (+{excess} mnt)
                          </span>
                        ) : !log.time_in ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            Sedang di Luar
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            Tepat Waktu
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
