import React, { useState, useMemo } from 'react';
import type { InOutLog, Employee } from '../../types';
import { 
  Clock, 
  LogOut, 
  LogIn, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Trash2, 
  Calendar
} from 'lucide-react';
import { 
  formatDuration, 
  calculateMinutesDiff, 
  getCurrentTimeString,
  formatIndonesianDate 
} from '../../utils/dateUtils';

interface InOutTrackerProps {
  logs: InOutLog[];
  employees?: Employee[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onOpenTimeOutModal: () => void;
  onOpenTimeInModal: (log?: InOutLog) => void;
  onDeleteLog: (id: string) => Promise<void>;
}

export const InOutTracker: React.FC<InOutTrackerProps> = ({
  logs,
  selectedDate,
  onSelectDate,
  onOpenTimeOutModal,
  onOpenTimeInModal,
  onDeleteLog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'outside' | 'completed' | 'overdue'>('all');
  const [purposeFilter, setPurposeFilter] = useState<string>('all');

  const currentTime = getCurrentTimeString();

  // Statistics for this day's logs
  const stats = useMemo(() => {
    const total = logs.length;
    const currentlyOut = logs.filter((l) => !l.time_in).length;
    const completed = logs.filter((l) => l.time_in !== null).length;
    
    // Check overdue either completed or currently live overdue
    const overdueCount = logs.filter((l) => {
      if (l.purpose !== 'Istirahat') return false;
      const maxBreak = l.employee?.max_break_minutes || 60;
      if (l.time_in) {
        return l.is_overdue || (l.duration_minutes || 0) > maxBreak;
      }
      // Live outside check
      const liveMinutes = calculateMinutesDiff(l.time_out, currentTime);
      return liveMinutes > maxBreak;
    }).length;

    return { total, currentlyOut, completed, overdueCount };
  }, [logs, currentTime]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const empName = log.employee?.name || '';
      const empNik = log.employee?.nik || log.employee?.nip || '';
      const matchSearch =
        empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empNik.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchPurpose = purposeFilter === 'all' || log.purpose === purposeFilter;

      let matchStatus = true;
      const maxBreak = log.employee?.max_break_minutes || 60;
      const isOverdueNow = log.purpose === 'Istirahat' && (
        log.time_in 
          ? (log.is_overdue || (log.duration_minutes || 0) > maxBreak)
          : calculateMinutesDiff(log.time_out, currentTime) > maxBreak
      );

      if (statusFilter === 'outside') {
        matchStatus = !log.time_in;
      } else if (statusFilter === 'completed') {
        matchStatus = Boolean(log.time_in);
      } else if (statusFilter === 'overdue') {
        matchStatus = isOverdueNow;
      }

      return matchSearch && matchPurpose && matchStatus;
    });
  }, [logs, searchTerm, purposeFilter, statusFilter, currentTime]);

  const handleDelete = async (log: InOutLog) => {
    const name = log.employee?.name || 'karyawan ini';
    if (window.confirm(`Hapus catatan keluar masuk ${name} (${log.time_out})?`)) {
      await onDeleteLog(log.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b] flex items-center">
            <Clock className="w-6 h-6 mr-2.5 text-blue-600" />
            Pencatatan Jam Keluar & Masuk
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau pergerakan karyawan keluar kantor, waktu istirahat, dan deteksi pelanggaran batas waktu istirahat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 text-xs">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={onOpenTimeOutModal}
            className="inline-flex items-center px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Input Jam Keluar
          </button>

          <button
            onClick={() => onOpenTimeInModal()}
            disabled={stats.currentlyOut === 0}
            className="inline-flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4 mr-1.5" />
            Input Jam Masuk ({stats.currentlyOut})
          </button>
        </div>
      </div>

      {/* Mini KPI Cards for in-out metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Aktivitas Keluar
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{formatIndonesianDate(selectedDate)}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            Sedang di Luar Kantor
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{stats.currentlyOut}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Menunggu jam masuk</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
            Sudah Kembali Masuk
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.completed}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Durasi terekam lengkap</div>
        </div>

        {/* Warning Indicator Card */}
        <div className={`p-4 rounded-xl border shadow-sm ${
          stats.overdueCount > 0 
            ? 'bg-amber-50/70 border-amber-300' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${
              stats.overdueCount > 0 ? 'text-amber-800' : 'text-slate-500'
            }`}>
              Pelanggaran Istirahat
            </span>
            {stats.overdueCount > 0 && <AlertTriangle className="w-4 h-4 text-amber-600" />}
          </div>
          <div className={`text-2xl font-bold mt-1 ${
            stats.overdueCount > 0 ? 'text-amber-900' : 'text-slate-900'
          }`}>
            {stats.overdueCount}
          </div>
          <div className={`text-[11px] mt-0.5 ${
            stats.overdueCount > 0 ? 'text-amber-700 font-medium' : 'text-slate-400'
          }`}>
            {stats.overdueCount > 0 ? 'Melebihi alokasi waktu istirahat' : 'Tidak ada pelanggaran'}
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama karyawan, NIK, atau catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="all">Semua Status Log ({logs.length})</option>
            <option value="outside">Sedang di Luar ({stats.currentlyOut})</option>
            <option value="completed">Sudah Kembali ({stats.completed})</option>
            <option value="overdue">Peringatan Melebihi Batas ({stats.overdueCount})</option>
          </select>
        </div>

        <div>
          <select
            value={purposeFilter}
            onChange={(e) => setPurposeFilter(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="all">Semua Keperluan</option>
            <option value="Istirahat">Istirahat</option>
            <option value="Antar Barang">Antar Barang</option>
            <option value="Gudang">Gudang</option>
            <option value="Lain - Lain">Lain - Lain</option>
            <option value="Ke Sekolah">Ke Sekolah</option>
            <option value="Sebar Brosur">Sebar Brosur</option>
            <option value="Pameran">Pameran</option>
            <option value="Sholat">Sholat</option>
            <option value="Toilet">Toilet</option>
            <option value="Tukar Uang">Tukar Uang</option>
            <option value="Tugas Luar">Tugas Luar</option>
            <option value="Keperluan Pribadi">Keperluan Pribadi</option>
            <option value="Medis">Medis</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>
      </div>

      {/* In-Out Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">Keperluan & Catatan</th>
                <th className="py-3 px-4 text-center">Jam Keluar</th>
                <th className="py-3 px-4 text-center">Jam Masuk</th>
                <th className="py-3 px-4 text-center">Total Waktu Keluar</th>
                <th className="py-3 px-4 text-center">Status & Peringatan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada catatan keluar-masuk pada tanggal ini.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const emp = log.employee;
                  const maxBreak = emp?.max_break_minutes || 60;
                  
                  // Live duration check if still outside
                  const isCurrentlyOut = !log.time_in;
                  const currentMinutes = isCurrentlyOut 
                    ? calculateMinutesDiff(log.time_out, currentTime)
                    : (log.duration_minutes || 0);

                  const isBreak = log.purpose === 'Istirahat';
                  const isExceeded = isBreak && (
                    log.time_in 
                      ? (log.is_overdue || currentMinutes > maxBreak)
                      : currentMinutes > maxBreak
                  );
                  const excessTime = Math.max(0, currentMinutes - maxBreak);

                  return (
                    <tr 
                      key={log.id} 
                      className={`transition-colors ${
                        isExceeded 
                          ? 'bg-amber-50/40 hover:bg-amber-50/70' 
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Karyawan info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-blue-100 flex items-center justify-center font-bold text-xs shrink-0">
                            {(emp?.name || 'K').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{emp?.name || 'Karyawan'}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {emp?.nik || emp?.nip || '-'} • {emp?.department || '-'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Purpose & Notes */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">{log.purpose}</span>
                        {log.notes && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                            {log.notes}
                          </div>
                        )}
                      </td>

                      {/* Time Out */}
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-800">
                        {log.time_out}
                      </td>

                      {/* Time In */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        {log.time_in ? (
                          <span className="font-semibold text-slate-800">{log.time_in}</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800">
                            Sedang di luar
                          </span>
                        )}
                      </td>

                      {/* Total Duration */}
                      <td className="py-3.5 px-4 text-center font-medium">
                        {isCurrentlyOut ? (
                          <span className="text-blue-700">
                            {formatDuration(currentMinutes)} (berjalan)
                          </span>
                        ) : (
                          <span className="text-slate-900">
                            {formatDuration(log.duration_minutes)} ({log.duration_minutes} mnt)
                          </span>
                        )}
                      </td>

                      {/* KEY FEATURE 1: Warning status jika melebihi batas waktu istirahat */}
                      <td className="py-3.5 px-4 text-center">
                        {isExceeded ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-600 shrink-0" />
                            <span>Melebihi Batas (+{excessTime} mnt)</span>
                          </span>
                        ) : isCurrentlyOut ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 mr-1 text-amber-600 shrink-0" />
                            Batas: {maxBreak} mnt
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
                            Tepat Waktu
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isCurrentlyOut && (
                            <button
                              onClick={() => onOpenTimeInModal(log)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              Catat Masuk
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(log)}
                            title="Hapus log ini"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
          <span>Menampilkan {filteredLogs.length} dari {logs.length} catatan keluar-masuk</span>
          <span>Waktu server lokal: {currentTime}</span>
        </div>
      </div>
    </div>
  );
};
