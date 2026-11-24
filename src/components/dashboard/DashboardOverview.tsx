import React, { useMemo } from 'react';
import type { Employee, DailyWorkLog, InOutLog, WorkStatus } from '../../types';
import { 
  Users, 
  UserCheck, 
  LogOut, 
  LogIn, 
  AlertTriangle, 
  FileDown, 
  ShieldAlert
} from 'lucide-react';
import { TodayWorkingList } from './TodayWorkingList';
import { 
  formatIndonesianDate, 
  calculateMinutesDiff, 
  getCurrentTimeString
} from '../../utils/dateUtils';

interface DashboardOverviewProps {
  employees: Employee[];
  workLogs: DailyWorkLog[];
  inOutLogs: InOutLog[];
  selectedDate: string;
  onOpenTimeOutModal: (employeeId?: string) => void;
  onOpenTimeInModal: (log?: InOutLog) => void;
  onOpenReportTab: () => void;
  onMarkAttendance: (employeeId: string, shiftStart?: string) => Promise<void>;
  onUpdateWorkStatus: (employeeId: string, status: WorkStatus, shiftEnd?: string) => Promise<void>;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  employees,
  workLogs,
  inOutLogs,
  selectedDate,
  onOpenTimeOutModal,
  onOpenTimeInModal,
  onOpenReportTab,
  onMarkAttendance,
  onUpdateWorkStatus,
}) => {
  const currentTime = getCurrentTimeString();

  // Metrics computation
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const workingToday = workLogs.length;
    const currentlyOutLogs = inOutLogs.filter((l) => !l.time_in);
    const currentlyOut = currentlyOutLogs.length;

    // Detect all break violations (both completed and live active)
    const overdueList = inOutLogs.filter((l) => {
      if (l.purpose !== 'Istirahat') return false;
      const maxBreak = l.employee?.max_break_minutes || 60;
      if (l.time_in) {
        return l.is_overdue || (l.duration_minutes || 0) > maxBreak;
      }
      return calculateMinutesDiff(l.time_out, currentTime) > maxBreak;
    });

    // Currently active overdue outings
    const liveOverdueOutings = currentlyOutLogs.filter((l) => {
      if (l.purpose !== 'Istirahat') return false;
      const maxBreak = l.employee?.max_break_minutes || 60;
      return calculateMinutesDiff(l.time_out, currentTime) > maxBreak;
    });

    return {
      totalEmployees,
      workingToday,
      currentlyOut,
      overdueBreaksCount: overdueList.length,
      liveOverdueOutings,
    };
  }, [employees, workLogs, inOutLogs, currentTime]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Gramedia Employee Monitoring System
          </div>
          <h2 className="text-2xl font-bold text-[#1e293b] mt-1">
            Dashboard Pemantauan Karyawan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {formatIndonesianDate(selectedDate)} • Waktu Server: {currentTime} WIB
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onOpenTimeOutModal()}
            className="inline-flex items-center px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Catat Karyawan Keluar
          </button>

          <button
            onClick={() => onOpenTimeInModal()}
            disabled={stats.currentlyOut === 0}
            className="inline-flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4 mr-1.5" />
            Catat Karyawan Masuk
          </button>

          <button
            onClick={onOpenReportTab}
            className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4 mr-1.5 text-slate-600" />
            Download PDF Hari Ini
          </button>
        </div>
      </div>

      {/* KEY FEATURE 1: WARNING BANNER JIKA KARYAWAN MENGAMBIL JAM ISTIRAHAT LEBIH DARI YANG DITENTUKAN */}
      {stats.liveOverdueOutings.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl border-y border-r border-amber-200 shadow-sm">
          <div className="flex items-start">
            <div className="shrink-0">
              <ShieldAlert className="h-5 w-5 text-amber-700 mt-0.5" />
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Peringatan Aktif: Karyawan Melebihi Batas Waktu Istirahat
                </h4>
                <div className="mt-1 text-xs text-amber-800 space-y-1">
                  {stats.liveOverdueOutings.map((log) => {
                    const maxBreak = log.employee?.max_break_minutes || 60;
                    const elapsed = calculateMinutesDiff(log.time_out, currentTime);
                    const excess = elapsed - maxBreak;
                    return (
                      <div key={log.id} className="flex items-center space-x-2">
                        <span>•</span>
                        <span>
                          <strong>{log.employee?.name}</strong> ({log.employee?.nik || log.employee?.nip} - {log.employee?.department})
                          keluar pukul <strong>{log.time_out}</strong> (durasi: {elapsed} menit, batas: {maxBreak} menit).
                        </span>
                        <span className="font-bold text-red-700 bg-red-100/70 px-2 py-0.5 rounded text-[11px]">
                          Terlambat +{excess} menit
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-3 md:mt-0 md:ml-4">
                <button
                  onClick={() => onOpenTimeInModal(stats.liveOverdueOutings[0])}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Catat Masuk Karyawan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Metric Cards (60-30-10 Palette) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Karyawan */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Karyawan
            </span>
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{stats.totalEmployees}</div>
            <div className="text-xs text-slate-500 mt-0.5">Seluruh unit & departemen</div>
          </div>
        </div>

        {/* Card 2: Hadir Hari Ini */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Bekerja Hari Ini
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-800">{stats.workingToday}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Tingkat kehadiran: {Math.round((stats.workingToday / (stats.totalEmployees || 1)) * 100)}%
            </div>
          </div>
        </div>

        {/* Card 3: Sedang di Luar */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Sedang di Luar
            </span>
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{stats.currentlyOut}</div>
            <div className="text-xs text-slate-500 mt-0.5">Istirahat / keperluan luar</div>
          </div>
        </div>

        {/* Card 4: Pelanggaran Istirahat (Warning) */}
        <div className={`p-5 rounded-xl border shadow-sm ${
          stats.overdueBreaksCount > 0 
            ? 'bg-amber-50/70 border-amber-300' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              stats.overdueBreaksCount > 0 ? 'text-amber-800' : 'text-slate-500'
            }`}>
              Pelanggaran Istirahat
            </span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              stats.overdueBreaksCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-bold ${
              stats.overdueBreaksCount > 0 ? 'text-amber-900' : 'text-slate-900'
            }`}>
              {stats.overdueBreaksCount}
            </div>
            <div className={`text-xs mt-0.5 ${
              stats.overdueBreaksCount > 0 ? 'text-amber-700 font-medium' : 'text-slate-500'
            }`}>
              {stats.overdueBreaksCount > 0 ? 'Melewati batas waktu' : 'Semua istirahat tertib'}
            </div>
          </div>
        </div>
      </div>

      {/* KEY FEATURE 2: DAFTAR KARYAWAN YANG BEKERJA PADA HARI ITU */}
      <TodayWorkingList
        employees={employees}
        workLogs={workLogs}
        inOutLogs={inOutLogs}
        onMarkAttendance={onMarkAttendance}
        onUpdateWorkStatus={onUpdateWorkStatus}
        onOpenTimeOutModalForEmp={(empId) => onOpenTimeOutModal(empId)}
        onOpenTimeInModalForEmp={(empId) => {
          const log = inOutLogs.find((l) => l.employee_id === empId && !l.time_in);
          onOpenTimeInModal(log);
        }}
      />
    </div>
  );
};
