import React, { useState, useMemo } from 'react';
import type { Employee } from '../../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Building2 
} from 'lucide-react';

interface EmployeeManagementProps {
  employees: Employee[];
  onAddEmployee: (emp: Omit<Employee, 'id' | 'created_at'>) => Promise<void>;
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
  onOpenAddModal: () => void;
  onEditEmployee: (emp: Employee) => void;
}

const PREDEFINED_DEPTS = [
  'SOA',
  'COUNTER - MG',
  'COUNTER - JETE',
  'COUNTER - ALFALINK',
  'COUNTER - THOMAS',
  'COUNTER - CONSINA',
  'COUNTER - PROMEX',
];

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  employees,
  onUpdateEmployee,
  onDeleteEmployee,
  onOpenAddModal,
  onEditEmployee,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const departments = useMemo(() => {
    const list = Array.from(new Set([...PREDEFINED_DEPTS, ...employees.map((e) => e.department)]));
    return list.sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const nik = emp.nik || emp.nip || '';
      const matchSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchDept = selectedDept === 'all' || emp.department === selectedDept;
      const matchStatus = selectedStatus === 'all' || emp.status === selectedStatus;

      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, searchTerm, selectedDept, selectedStatus]);

  const handleDelete = async (emp: Employee) => {
    const nik = emp.nik || emp.nip || '-';
    if (window.confirm(`Yakin ingin menghapus karyawan "${emp.name}" (${nik})?`)) {
      await onDeleteEmployee(emp.id);
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    const nextStatus = emp.status === 'active' ? 'inactive' : 'active';
    await onUpdateEmployee(emp.id, { status: nextStatus });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1e293b] flex items-center">
            <Users className="w-6 h-6 mr-2.5 text-blue-600" />
            Master Data Karyawan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar karyawan unit <strong>SOA</strong> dan <strong>COUNTER</strong> (MG, JETE, ALFALINK, THOMAS, CONSINA, PROMEX) dengan alokasi batas istirahat.
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Tambah Karyawan Baru
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama, NIK, atau departemen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        {/* Dept Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="all">Semua Departemen ({employees.length})</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="all">Semua Status</option>
            <option value="active">Hanya Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Employee Table: NIK, Nama, Departemen (SOA/COUNTER), Batas Istirahat, Status, Aksi */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 font-mono">NIK</th>
                <th className="py-3 px-4">Nama Karyawan</th>
                <th className="py-3 px-4">Departemen</th>
                <th className="py-3 px-4 text-center">Batas Istirahat</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada data karyawan yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const nik = emp.nik || emp.nip || '-';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* NIK */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-900">
                        {nik}
                      </td>

                      {/* Nama Karyawan */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-blue-100 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {emp.name.substring(0, 2)}
                          </div>
                          <div className="font-semibold text-slate-900">{emp.name}</div>
                        </div>
                      </td>

                      {/* Departemen */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                          emp.department === 'SOA'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          <Building2 className="w-3 h-3 mr-1.5 opacity-70" />
                          {emp.department}
                        </span>
                      </td>

                      {/* Batas Istirahat */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <Clock className="w-3 h-3 mr-1 text-slate-500" />
                          {emp.max_break_minutes} Menit
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(emp)}
                          title="Klik untuk mengubah status"
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium cursor-pointer transition-colors ${
                            emp.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {emp.status === 'active' ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1 text-slate-400" />
                              Nonaktif
                            </>
                          )}
                        </button>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => onEditEmployee(emp)}
                            title="Ubah data karyawan"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(emp)}
                            title="Hapus karyawan"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
          <span>Menampilkan {filteredEmployees.length} dari {employees.length} karyawan</span>
          <span>Batas istirahat: 60 mnt (SOA) / 45-60 mnt (COUNTER)</span>
        </div>
      </div>
    </div>
  );
};
