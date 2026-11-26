import React, { useState, useEffect } from 'react';
import type { InOutLog } from '../../types';
import { LogIn, X, Clock, AlertTriangle, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { 
  getCurrentTimeWithSeconds, 
  calculateSecondsDiff, 
  formatDuration,
  formatElapsedTimer 
} from '../../utils/dateUtils';

interface RecordTimeInModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLogs: InOutLog[];
  selectedLog?: InOutLog | null;
  onSubmit: (logId: string, timeIn: string) => Promise<void>;
}

export const RecordTimeInModal: React.FC<RecordTimeInModalProps> = ({
  isOpen,
  onClose,
  activeLogs,
  selectedLog,
  onSubmit,
}) => {
  const [currentLogId, setCurrentLogId] = useState('');
  const [timeIn, setTimeIn] = useState(getCurrentTimeWithSeconds());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTimeIn(getCurrentTimeWithSeconds());
    const interval = setInterval(() => {
      setTimeIn(getCurrentTimeWithSeconds());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (selectedLog) {
        setCurrentLogId(selectedLog.id);
      } else if (activeLogs.length > 0) {
        setCurrentLogId(activeLogs[0].id);
      } else {
        setCurrentLogId('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedLog]);

  if (!isOpen) return null;

  const currentLog = activeLogs.find((l) => l.id === currentLogId) || selectedLog;
  const employee = currentLog?.employee;
  const maxBreakMinutes = employee?.max_break_minutes || 60;

  // Kalkulasi durasi realtime hingga detik
  const elapsedSeconds = currentLog ? calculateSecondsDiff(currentLog.time_out, timeIn) : 0;
  const durationMinutes = Math.floor(elapsedSeconds / 60);
  const isBreakPurpose = currentLog?.purpose === 'Istirahat';
  const isOverdue = isBreakPurpose && elapsedSeconds > maxBreakMinutes * 60;
  const excessSeconds = Math.max(0, elapsedSeconds - maxBreakMinutes * 60);
  const excessMinutes = Math.floor(excessSeconds / 60);
  const excessRemSeconds = excessSeconds % 60;
  const excessLabel = excessMinutes > 0
    ? `${excessMinutes} menit${excessRemSeconds > 0 ? ` ${excessRemSeconds} detik` : ''}`
    : `${excessRemSeconds} detik`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLogId) {
      setError('Silakan pilih catatan karyawan keluar.');
      return;
    }
    if (!timeIn) {
      setError('Jam masuk wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(currentLogId, timeIn);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal mencatat jam masuk.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <LogIn className="w-5 h-5 text-blue-200" />
            <h3 className="font-semibold text-base">Catat Karyawan Masuk / Kembali</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!currentLog && activeLogs.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 text-center">
              Saat ini tidak ada karyawan yang sedang tercatat di luar kantor.
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Karyawan yang Kembali
                </label>
                <select
                  value={currentLogId}
                  onChange={(e) => setCurrentLogId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                >
                  {activeLogs.map((log) => (
                    <option key={log.id} value={log.id}>
                      {log.employee?.name || 'Karyawan'} ({log.employee?.nik || log.employee?.nip}) - Keluar: {log.time_out} ({log.purpose})
                    </option>
                  ))}
                </select>
              </div>

              {currentLog && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Keperluan:</span>
                    <span className="font-semibold text-slate-800">{currentLog.purpose}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Jam Keluar:</span>
                    <span className="font-mono font-semibold text-slate-800">{currentLog.time_out}</span>
                  </div>
                  {isBreakPurpose && (
                    <div className="flex justify-between text-slate-600">
                      <span>Batas Maksimal Istirahat:</span>
                      <span className="font-semibold text-blue-700">{maxBreakMinutes} Menit</span>
                    </div>
                  )}
                  {currentLog.notes && (
                    <div className="pt-1 text-[11px] text-slate-500 italic border-t border-slate-200">
                      Catatan: {currentLog.notes}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jam Kembali / Masuk (Terkunci)
                </label>
                <div className="flex items-center justify-between px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs font-bold">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-sm">{timeIn} WIB</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans font-normal">Otomatis Real-time</span>
                </div>
              </div>

              {/* Kalkulasi Ringkasan & Warning Alert */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-700 font-medium">
                  <span className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                    Total Durasi di Luar:
                  </span>
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {formatElapsedTimer(elapsedSeconds)} ({formatDuration(durationMinutes)})
                  </span>
                </div>

                {/* KEY FEATURE 1: Warning jika karyawan mengambil jam istirahat lebih dari yang ditentukan */}
                {isBreakPurpose && isOverdue && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-800">
                        PERINGATAN: Melebihi Batas Istirahat!
                      </div>
                      <div className="text-[11px] text-amber-700 mt-0.5">
                        Karyawan istirahat selama {formatElapsedTimer(elapsedSeconds)} (batas: {maxBreakMinutes} menit). 
                        Terlambat <strong>{excessLabel}</strong>. Status pelanggaran akan dicatat dalam laporan.
                      </div>
                    </div>
                  </div>
                )}

                {isBreakPurpose && !isOverdue && elapsedSeconds > 0 && (
                  <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Waktu istirahat tepat waktu (masih dalam batas {maxBreakMinutes} menit).</span>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Konfirmasi Masuk'}</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
