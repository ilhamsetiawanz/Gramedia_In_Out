import React, { useState, useEffect } from 'react';
import type { Employee } from '../../types';
import { LogIn, X, AlertCircle, Lock, Building2 } from 'lucide-react';
import { getCurrentTimeString } from '../../utils/dateUtils';

interface ClockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  selectedEmployeeId?: string | null;
  onSubmit: (employeeId: string, shiftName: string, clockInTime: string) => Promise<void>;
}

export const SHIFT_OPTIONS = [
  { name: 'Shift Pagi', time: '08:00 - 16:00' },
  { name: 'Shift Middle', time: '10:00 - 18:00' },
  { name: 'Shift Siang', time: '13:00 - 21:00' },
];

export const ClockInModal: React.FC<ClockInModalProps> = ({
  isOpen,
  onClose,
  employees,
  selectedEmployeeId,
  onSubmit,
}) => {
  const [employeeId, setEmployeeId] = useState('');
  const [shiftName, setShiftName] = useState('Shift Pagi');
  const [clockInTime, setClockInTime] = useState(getCurrentTimeString());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClockInTime(getCurrentTimeString());
      setError(null);
      if (selectedEmployeeId) {
        setEmployeeId(selectedEmployeeId);
      } else if (employees.length > 0) {
        setEmployeeId(employees[0].id);
      } else {
        setEmployeeId('');
      }
    }
  }, [isOpen, selectedEmployeeId, employees]);

  if (!isOpen) return null;

  const selectedEmployee = employees.find((e) => e.id === employeeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setError('Silakan pilih karyawan terlebih dahulu.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const currentTime = getCurrentTimeString();
      await onSubmit(employeeId, shiftName, currentTime);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal melakukan Clock In presensi.');
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
            <h3 className="font-semibold text-base">Absen Masuk (Clock In)</h3>
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

          {employees.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              Belum ada data karyawan terdaftar. Silakan tambahkan data karyawan terlebih dahulu.
            </div>
          ) : (
            <>
              {/* Pilih Karyawan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Karyawan
                </label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nik || emp.nip} - {emp.name} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              {selectedEmployee && (
                <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-slate-600 flex items-center justify-between">
                  <span className="flex items-center font-medium text-slate-700">
                    <Building2 className="w-3.5 h-3.5 mr-1 text-blue-600" />
                    {selectedEmployee.department}
                  </span>
                  <span className="text-slate-500 font-mono">
                    NIK: <strong>{selectedEmployee.nik || selectedEmployee.nip}</strong>
                  </span>
                </div>
              )}

              {/* Pilihan Shift Kerja */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Pengaturan Shift Kerja
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SHIFT_OPTIONS.map((opt) => (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => setShiftName(opt.name)}
                      className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                        shiftName === opt.name
                          ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs">{opt.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{opt.time}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Jam Masuk Terkunci Real-time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jam Masuk (Terkunci Real-time)
                </label>
                <div className="flex items-center justify-between px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs font-bold">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-sm">{clockInTime} WIB</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans font-normal">Sistem Anti-Manipulasi</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Jam masuk otomatis terekam pada saat konfirmasi absensi dilakukan.
                </p>
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
                  <span>{isSubmitting ? 'Memproses...' : 'Konfirmasi Clock In'}</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
