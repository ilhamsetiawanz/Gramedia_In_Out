import React, { useState, useEffect } from 'react';
import type { Employee, InOutPurpose } from '../../types';
import { LogOut, X, Clock, AlertCircle, Info, Lock } from 'lucide-react';
import { getCurrentTimeString } from '../../utils/dateUtils';

interface RecordTimeOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  currentlyOutEmployeeIds: string[];
  onSubmit: (employeeId: string, purpose: InOutPurpose, timeOut: string, notes: string) => Promise<void>;
}

const PURPOSES: InOutPurpose[] = [
  'Istirahat',
  'Tugas Luar',
  'Keperluan Pribadi',
  'Medis',
  'Lainnya',
];

export const RecordTimeOutModal: React.FC<RecordTimeOutModalProps> = ({
  isOpen,
  onClose,
  employees,
  currentlyOutEmployeeIds,
  onSubmit,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [purpose, setPurpose] = useState<InOutPurpose>('Istirahat');
  const [timeOut, setTimeOut] = useState(getCurrentTimeString());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter karyawan aktif yang sedang TIDAK di luar
  const availableEmployees = employees.filter(
    (e) => e.status === 'active' && !currentlyOutEmployeeIds.includes(e.id)
  );

  useEffect(() => {
    if (isOpen) {
      setTimeOut(getCurrentTimeString());
      setPurpose('Istirahat');
      setNotes('');
      setError(null);
      if (availableEmployees.length > 0) {
        setSelectedEmpId(availableEmployees[0].id);
      } else {
        setSelectedEmpId('');
      }
    }
  }, [isOpen, employees, currentlyOutEmployeeIds]);

  if (!isOpen) return null;

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) {
      setError('Silakan pilih karyawan terlebih dahulu.');
      return;
    }
    if (!timeOut) {
      setError('Jam keluar wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(selectedEmpId, purpose, timeOut, notes);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal mencatat jam keluar.');
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
            <LogOut className="w-5 h-5 text-blue-200" />
            <h3 className="font-semibold text-base">Catat Karyawan Keluar</h3>
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

          {availableEmployees.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              Semua karyawan aktif sudah tercatat sedang berada di luar kantor atau belum ada karyawan terdaftar.
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Karyawan
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                >
                  {availableEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nik || emp.nip} - {emp.name} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              {selectedEmployee && (
                <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-slate-600 flex items-center justify-between">
                  <span>Departemen: <strong>{selectedEmployee.department}</strong></span>
                  <span className="text-blue-800 font-medium flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-blue-600" />
                    Batas Istirahat: {selectedEmployee.max_break_minutes} Menit
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Keperluan Keluar
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as InOutPurpose)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  >
                    {PURPOSES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Keluar (Terkunci)
                  </label>
                  <div className="flex items-center space-x-2 px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs font-bold">
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{timeOut} WIB</span>
                    <span className="text-[10px] text-slate-500 font-sans font-normal ml-auto">Otomatis Real-time</span>
                  </div>
                </div>
              </div>

              {purpose === 'Istirahat' && selectedEmployee && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-start space-x-2">
                  <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>
                    Sistem otomatis mengaktifkan peringatan (warning) jika durasi istirahat melebihi{' '}
                    <strong>{selectedEmployee.max_break_minutes} menit</strong> saat jam masuk dicatat.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
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
                  <LogOut className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Konfirmasi Keluar'}</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
