import React, { useState, useEffect } from 'react';
import type { Employee, EmployeeStatus } from '../../types';
import { X, UserPlus, Save, AlertCircle } from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Omit<Employee, 'id' | 'created_at'>) => Promise<void>;
  initialData?: Employee | null;
}

export const DEPARTMENTS = [
  'SOA',
  'COUNTER - MG',
  'COUNTER - JETE',
  'COUNTER - ALFALINK',
  'COUNTER - THOMAS',
  'COUNTER - CONSINA',
  'COUNTER - PROMEX',
];

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [nik, setNik] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [maxBreakMinutes, setMaxBreakMinutes] = useState(60);
  const [status, setStatus] = useState<EmployeeStatus>('active');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departmentOptions = React.useMemo(() => {
    if (initialData?.department && !DEPARTMENTS.includes(initialData.department)) {
      return [initialData.department, ...DEPARTMENTS];
    }
    return DEPARTMENTS;
  }, [initialData]);

  useEffect(() => {
    if (initialData) {
      setNik(initialData.nik || initialData.nip || '');
      setName(initialData.name);
      setDepartment(initialData.department || DEPARTMENTS[0]);
      setMaxBreakMinutes(initialData.max_break_minutes || 60);
      setStatus(initialData.status);
    } else {
      setNik('');
      setName('');
      setDepartment(DEPARTMENTS[0]);
      setMaxBreakMinutes(60);
      setStatus('active');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nik.trim() || !name.trim()) {
      setError('Mohon lengkapi NIK dan Nama Lengkap Karyawan.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        nik: nik.trim().toUpperCase(),
        nip: nik.trim().toUpperCase(),
        name: name.trim(),
        department,
        max_break_minutes: Number(maxBreakMinutes) || 60,
        status,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal menyimpan data karyawan.');
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
            <UserPlus className="w-5 h-5 text-blue-200" />
            <h3 className="font-semibold text-base">
              {initialData ? 'Ubah Data Karyawan' : 'Tambah Karyawan Baru'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIK (Nomor Induk Karyawan)
              </label>
              <input
                type="text"
                required
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Karyawan
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap Karyawan
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Departemen (SOA / COUNTER)
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            >
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Batas Waktu Istirahat (Menit)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={1}
                max={180}
                step={1}
                required
                value={maxBreakMinutes}
                onChange={(e) => setMaxBreakMinutes(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
              <span className="text-xs text-slate-500 font-medium shrink-0">Menit</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Standar: 60 menit (warning aktif otomatis bila istirahat melebihi batas ini)
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
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Data'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
