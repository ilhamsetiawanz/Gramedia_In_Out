import React, { useState } from 'react';
import type { Employee, DailyWorkLog, InOutLog, WorkStatus } from '../../types';
import { 
  CheckCircle2, 
  LogOut, 
  LogIn, 
  AlertTriangle, 
  Search, 
  UserCheck, 
  Coffee, 
  Building2, 
  Clock,
  CalendarCheck
} from 'lucide-react';
import { getCurrentTimeString } from '../../utils/dateUtils';
import { ClockInModal } from './ClockInModal';

interface TodayWorkingListProps {
  employees: Employee[];
  workLogs: DailyWorkLog[];
  inOutLogs: InOutLog[];
  onMarkAttendance: (employeeId: string, shiftName: string, shiftStart?: string) => Promise<void>;
  onUpdateWorkStatus: (employeeId: string, status: WorkStatus, shiftEnd?: string) => Promise<void>;
  onOpenTimeOutModalForEmp?: (employeeId: string) => void;
  onOpenTimeInModalForEmp?: (employeeId: string) => void;
}

export const TodayWorkingList: React.FC<TodayWorkingListProps> = ({
  employees,
  workLogs,
  inOutLogs,
  onMarkAttendance,
  onUpdateWorkStatus,
  onOpenTimeOutModalForEmp,
  onOpenTimeInModalForEmp,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // State Modal Clock In
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [selectedEmpForClockIn, setSelectedEmpForClockIn] = useState<string | null>(null);

  const workLogMap = new Map(workLogs.map((l) => [l.employee_id, l]));

  // Gabungkan semua data karyawan dengan status presensi hari ini
  const employeeAttendanceData = employees.map((emp) => {
    const workLog = workLogMap.get(emp.id);
    const empInOutLogs = inOutLogs.filter((l) => l.employee_id === emp.id);
    
    // Cek apakah karyawan sedang di luar kantor
    const activeOutLog = empInOutLogs.find((l) => !l.time_in);
    
    // Cek apakah ada pelanggaran istirahat hari ini
    const hasOverdueBreak = empInOutLogs.some((l) => l.is_overdue);

    return {
      employee: emp,
      isWorkingToday: Boolean(workLog),
      workLog,
      activeOutLog,
      hasOverdueBreak,
      inOutCount: empInOutLogs.length,
      status: workLog ? workLog.status : 'not_started',
    };
  });

  const filteredData = employeeAttendanceData.filter((item) => {
    const nik = item.employee.nik || item.employee.nip || '';
    const matchSearch =
      item.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employee.department.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (filterStatus === 'working') {
      return item.isWorkingToday && !item.activeOutLog && item.status !== 'completed';
    }
    if (filterStatus === 'out') {
      return Boolean(item.activeOutLog);
    }
    if (filterStatus === 'overdue') {
      return item.hasOverdueBreak;
    }
    if (filterStatus === 'not_present') {
      return !item.isWorkingToday;
    }
    return true;
  });

  const handleOpenClockInModal = (empId?: string) => {
    setSelectedEmpForClockIn(empId || null);
    setIsClockInModalOpen(true);
  };

  const handleClockInSubmit = async (empId: string, shiftName: string, clockInTime: string) => {
    await onMarkAttendance(empId, shiftName, clockInTime);
  };

  // Clock Out: jam keluar otomatis mengikuti waktu saat tombol ditekan
  const handleClockOut = async (empId: string) => {
    const currentClockOut = getCurrentTimeString();
    await onUpdateWorkStatus(empId, 'completed', currentClockOut);
  };

  const currentTime = getCurrentTimeString();
  const notClockedInEmployees = employees.filter((e) => !workLogMap.has(e.id));

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header section */}
      <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center">
            <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
            Daftar Karyawan yang Bekerja Hari Ini
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Presensi shift real-time: pilih shift kerja saat <strong>Clock In</strong> dan jam pulang otomatis saat <strong>Clock Out</strong>.
          </p>
        </div>

        {/* Filters & Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama, NIK, atau counter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-8 pr-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">Semua Karyawan ({employees.length})</option>
            <option value="working">Aktif di Kantor</option>
            <option value="out">Sedang Keluar / Istirahat</option>
            <option value="overdue">Pelanggaran Istirahat</option>
            <option value="not_present">Belum Clock In</option>
          </select>

          {notClockedInEmployees.length > 0 && (
            <button
              onClick={() => handleOpenClockInModal()}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 mr-1.5" />
              Clock In Karyawan
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 font-mono">NIK</th>
              <th className="py-3 px-4">Nama Karyawan</th>
              <th className="py-3 px-4">Departemen</th>
              <th className="py-3 px-4 text-center">Shift Kerja</th>
              <th className="py-3 px-4 text-center">Jam Masuk (Clock In)</th>
              <th className="py-3 px-4 text-center">Jam Keluar (Clock Out)</th>
              <th className="py-3 px-4 text-center">Status Keberadaan</th>
              <th className="py-3 px-4 text-center">Catatan Istirahat</th>
              <th className="py-3 px-4 text-right">Aksi Presensi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  {employees.length === 0 
                    ? 'Belum ada data karyawan terdaftar. Silakan tambahkan data karyawan di menu "Data Karyawan".'
                    : 'Tidak ada data karyawan yang cocok dengan kriteria filter.'}
                </td>
              </tr>
            ) : (
              filteredData.map((item) => {
                const { employee, isWorkingToday, workLog, activeOutLog, hasOverdueBreak } = item;
                const nik = employee.nik || employee.nip || '-';
                const shiftName = workLog?.shift_name || workLog?.notes || '-';

                return (
                  <tr key={employee.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* NIK */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-900">
                      {nik}
                    </td>

                    {/* Employee Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-blue-100 flex items-center justify-center font-bold text-xs shrink-0">
                          {employee.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="font-semibold text-slate-900">{employee.name}</div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        employee.department === 'SOA'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        <Building2 className="w-3 h-3 mr-1 opacity-70" />
                        {employee.department}
                      </span>
                    </td>

                    {/* Shift Kerja */}
                    <td className="py-3.5 px-4 text-center">
                      {isWorkingToday ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300">
                          <CalendarCheck className="w-3 h-3 mr-1 text-slate-500" />
                          {shiftName}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Shift Start / Clock In */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      {isWorkingToday ? (
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {workLog?.shift_start}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Belum Masuk</span>
                      )}
                    </td>

                    {/* Shift End / Clock Out */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      {isWorkingToday && workLog?.shift_end ? (
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                          {workLog.shift_end}
                        </span>
                      ) : isWorkingToday ? (
                        <span className="text-slate-500 text-[11px] font-medium">Sedang Bekerja</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Current Location / Status */}
                    <td className="py-3.5 px-4 text-center">
                      {!isWorkingToday ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Belum Presensi
                        </span>
                      ) : workLog?.status === 'completed' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300">
                          Selesai (Clock Out)
                        </span>
                      ) : activeOutLog ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                          <Coffee className="w-3 h-3 mr-1 text-amber-600 shrink-0" />
                          Sedang di Luar ({activeOutLog.time_out})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
                          Aktif di Tempat
                        </span>
                      )}
                    </td>

                    {/* Break History & Warning */}
                    <td className="py-3.5 px-4 text-center">
                      {hasOverdueBreak ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3 mr-1 text-red-600 shrink-0" />
                          Melebihi Batas Istirahat
                        </span>
                      ) : item.inOutCount > 0 ? (
                        <span className="text-[11px] text-slate-600 font-medium">
                          {item.inOutCount}x Keluar (Tertib)
                        </span>
                      ) : isWorkingToday ? (
                        <span className="text-[11px] text-slate-400">Belum keluar istirahat</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Quick Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {!isWorkingToday ? (
                          <button
                            onClick={() => handleOpenClockInModal(employee.id)}
                            title="Lakukan Clock In presensi masuk"
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-medium transition-colors flex items-center cursor-pointer shadow-xs"
                          >
                            <LogIn className="w-3 h-3 mr-1" />
                            Clock In
                          </button>
                        ) : workLog?.status !== 'completed' ? (
                          <>
                            {activeOutLog ? (
                              <button
                                onClick={() => onOpenTimeInModalForEmp && onOpenTimeInModalForEmp(employee.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition-colors flex items-center cursor-pointer"
                              >
                                <LogIn className="w-3 h-3 mr-1" />
                                Catat Masuk
                              </button>
                            ) : (
                              <button
                                onClick={() => onOpenTimeOutModalForEmp && onOpenTimeOutModalForEmp(employee.id)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium border border-slate-300 transition-colors flex items-center cursor-pointer"
                              >
                                <LogOut className="w-3 h-3 mr-1 text-slate-500" />
                                Catat Keluar
                              </button>
                            )}
                            <button
                              onClick={() => handleClockOut(employee.id)}
                              title={`Clock Out shift pada jam sekarang (${currentTime})`}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-[11px] font-medium transition-colors flex items-center cursor-pointer"
                            >
                              <Clock className="w-3 h-3 mr-1 text-slate-600" />
                              Clock Out
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Shift Selesai</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <span>Total Hadir: {employeeAttendanceData.filter((e) => e.isWorkingToday).length} dari {employees.length} karyawan</span>
        <span>Waktu saat ini: {currentTime} WIB (otomatis tercatat real-time tanpa manipulasi)</span>
      </div>

      {/* Modal Absen Masuk (Clock In) */}
      <ClockInModal
        isOpen={isClockInModalOpen}
        onClose={() => {
          setIsClockInModalOpen(false);
          setSelectedEmpForClockIn(null);
        }}
        employees={selectedEmpForClockIn ? employees.filter((e) => e.id === selectedEmpForClockIn) : notClockedInEmployees}
        selectedEmployeeId={selectedEmpForClockIn}
        onSubmit={handleClockInSubmit}
      />
    </div>
  );
};
