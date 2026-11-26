import React, { useState, useEffect } from 'react';
import type { InOutLog } from '../../types';
import { Trash2, X, Lock, Eye, EyeOff, AlertCircle, ShieldAlert } from 'lucide-react';
import { verifyAdminPassword } from '../../services/authService';

interface ConfirmDeleteLogModalProps {
  isOpen: boolean;
  log: InOutLog | null;
  adminEmail: string;
  onClose: () => void;
  onConfirmDelete: (logId: string) => Promise<void>;
}

export const ConfirmDeleteLogModal: React.FC<ConfirmDeleteLogModalProps> = ({
  isOpen,
  log,
  adminEmail,
  onClose,
  onConfirmDelete,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      setError(null);
    }
  }, [isOpen, log]);

  if (!isOpen || !log) return null;

  const empName = log.employee?.name || 'Karyawan';
  const empNik = log.employee?.nik || log.employee?.nip || '-';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Silakan masukkan kata sandi akun untuk menghapus data.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await verifyAdminPassword(adminEmail, password);
      await onConfirmDelete(log.id);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Verifikasi kata sandi gagal. Data tidak dihapus.');
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
            <ShieldAlert className="w-5 h-5 text-red-300" />
            <h3 className="font-semibold text-base">Konfirmasi Hapus Data Keluar Masuk</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1.5">
            <div className="font-bold text-amber-900">
              Peringatan Keamanan Data
            </div>
            <p className="text-[11px] text-amber-800">
              Data keluar masuk yang sudah dihapus tidak dapat dikembalikan. Verifikasi kata sandi akun admin diperlukan untuk mencegah penghapusan tidak sah.
            </p>
          </div>

          {/* Detail log yang akan dihapus */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Karyawan:</span>
              <span className="font-semibold text-slate-900">{empName} ({empNik})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Keperluan:</span>
              <span className="font-semibold text-slate-800">{log.purpose}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Jam Keluar / Masuk:</span>
              <span className="font-mono font-semibold text-slate-800">
                {log.time_out} - {log.time_in || 'Belum Masuk'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Akun Verifikasi
            </label>
            <input
              type="text"
              readOnly
              value={adminEmail}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-600 font-medium focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Masukkan Kata Sandi Akun
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi akun Anda"
                className="w-full text-xs pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
              disabled={isSubmitting || !password}
              className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Memverifikasi...' : 'Verifikasi & Hapus'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
