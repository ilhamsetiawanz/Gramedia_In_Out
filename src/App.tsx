import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { InOutTracker } from './components/inout/InOutTracker';
import { EmployeeManagement } from './components/employees/EmployeeManagement';
import { DailyReportView } from './components/reports/DailyReportView';
import { RecordTimeOutModal } from './components/inout/RecordTimeOutModal';
import { RecordTimeInModal } from './components/inout/RecordTimeInModal';
import { EmployeeModal } from './components/employees/EmployeeModal';
import { SupabaseSettingsModal } from './components/common/SupabaseSettingsModal';

import type { 
  Employee, 
  DailyWorkLog, 
  InOutLog, 
  InOutPurpose, 
  WorkStatus 
} from './types';
import { 
  getEmployees, 
  addEmployee, 
  updateEmployee, 
  deleteEmployee, 
  getDailyWorkLogs, 
  markEmployeeAttendance, 
  updateDailyWorkStatus, 
  getInOutLogs, 
  recordTimeOut, 
  recordTimeIn, 
  deleteInOutLog,
  initializeStorage
} from './services/dataService';
import { getTodayDateString } from './utils/dateUtils';
import { isSupabaseConfigured } from './lib/supabase';

import { 
  LayoutDashboard, 
  Clock, 
  Users, 
  FileText, 
  LogOut, 
  Database, 
  ShieldCheck, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

type ActiveTab = 'dashboard' | 'inout' | 'employees' | 'reports';

const MainApp: React.FC = () => {
  const { admin, logout } = useAuth();
  
  // Navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('gramedia_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('gramedia_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Global Date selection
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workLogs, setWorkLogs] = useState<DailyWorkLog[]>([]);
  const [inOutLogs, setInOutLogs] = useState<InOutLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isTimeOutModalOpen, setIsTimeOutModalOpen] = useState(false);
  const [isTimeInModalOpen, setIsTimeInModalOpen] = useState(false);
  const [selectedLogForTimeIn, setSelectedLogForTimeIn] = useState<InOutLog | null>(null);
  
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      initializeStorage();
      const [empData, workData, inOutData] = await Promise.all([
        getEmployees(),
        getDailyWorkLogs(selectedDate),
        getInOutLogs(selectedDate),
      ]);
      setEmployees(empData);
      setWorkLogs(workData);
      setInOutLogs(inOutData);
    } catch (e) {
      console.error('Failed to load application data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers for In-Out
  const handleRecordTimeOut = async (
    employeeId: string, 
    purpose: InOutPurpose, 
    timeOutStr: string, 
    notes: string
  ) => {
    await recordTimeOut(employeeId, purpose, timeOutStr, notes, selectedDate);
    await loadData();
  };

  const handleRecordTimeIn = async (logId: string, timeInStr: string) => {
    await recordTimeIn(logId, timeInStr);
    await loadData();
  };

  const handleDeleteInOutLog = async (id: string) => {
    await deleteInOutLog(id);
    await loadData();
  };

  // Handlers for Employees
  const handleSaveEmployee = async (empData: Omit<Employee, 'id' | 'created_at'>) => {
    if (editingEmployee) {
      await updateEmployee(editingEmployee.id, empData);
    } else {
      await addEmployee(empData);
    }
    await loadData();
  };

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>) => {
    await updateEmployee(id, updates);
    await loadData();
  };

  const handleDeleteEmployee = async (id: string) => {
    await deleteEmployee(id);
    await loadData();
  };

  // Handlers for Daily Work Logs (Kehadiran Harian)
  const handleMarkAttendance = async (
    employeeId: string, 
    shiftName: string = 'Shift Pagi', 
    shiftStart?: string
  ) => {
    await markEmployeeAttendance(employeeId, selectedDate, shiftName, shiftStart, 'working');
    await loadData();
  };

  const handleUpdateWorkStatus = async (
    employeeId: string, 
    status: WorkStatus, 
    shiftEnd?: string
  ) => {
    await updateDailyWorkStatus(employeeId, status, selectedDate, shiftEnd);
    await loadData();
  };

  // Active out logs for Time In modal
  const activeOutLogs = inOutLogs.filter((l) => !l.time_in);
  const currentlyOutEmpIds = activeOutLogs.map((l) => l.employee_id);

  // Check Supabase status
  const supabaseConnected = isSupabaseConfigured();

  // If not authenticated, render LoginPage
  if (!admin) {
    return <LoginPage />;
  }

  return (
    <div className="h-screen overflow-hidden bg-[#f4f7fb] flex text-slate-800">
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ================= SIDEBAR (Terkunci & Bisa Buka/Tutup) ================= */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 md:static md:h-screen md:sticky md:top-0
          flex-shrink-0 bg-[#1e3a5f] text-white flex flex-col justify-between
          transition-all duration-300 ease-in-out select-none
          ${mobileMenuOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:translate-x-0'}
          ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
        `}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo Brand Header & Toggle */}
          <div className="p-4 flex items-center justify-between border-b border-blue-900/60 min-h-[64px]">
            {!isSidebarCollapsed ? (
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-blue-600/90 text-white flex items-center justify-center shadow-xs shrink-0">
                  <ShieldCheck className="w-5 h-5 text-blue-100" />
                </div>
                <div className="truncate">
                  <h1 className="font-bold text-sm tracking-tight text-white leading-none truncate">
                    Gramedia In-Out
                  </h1>
                  <span className="text-[10px] text-blue-200 uppercase tracking-widest mt-1 block truncate">
                    Attendance Tracker
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <div 
                  className="w-9 h-9 rounded-xl bg-blue-600/90 text-white flex items-center justify-center shadow-xs shrink-0 cursor-pointer"
                  onClick={toggleSidebar}
                  title="Klik untuk membuka sidebar"
                >
                  <ShieldCheck className="w-5 h-5 text-blue-100" />
                </div>
              </div>
            )}

            {/* Desktop toggle button */}
            <button
              type="button"
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
              className={`hidden md:flex p-1.5 text-blue-200 hover:text-white hover:bg-[#274770] rounded-lg transition-colors cursor-pointer ${
                isSidebarCollapsed ? 'mx-auto' : ''
              }`}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 text-blue-200 hover:text-white rounded-lg focus:outline-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
              title="Dashboard Utama"
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3.5 py-2.5'} rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-100 hover:bg-[#274770] hover:text-white'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${!isSidebarCollapsed ? 'mr-3 shrink-0' : ''}`} />
              {!isSidebarCollapsed && <span>Dashboard Utama</span>}
            </button>

            <button
              onClick={() => {
                setActiveTab('inout');
                setMobileMenuOpen(false);
              }}
              title="Jam Keluar Masuk"
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-3 relative' : 'justify-between px-3.5 py-2.5'} rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'inout'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-100 hover:bg-[#274770] hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <Clock className={`w-4 h-4 ${!isSidebarCollapsed ? 'mr-3 shrink-0' : ''}`} />
                {!isSidebarCollapsed && <span>Jam Keluar Masuk</span>}
              </div>
              {activeOutLogs.length > 0 && (
                <span className={`bg-amber-400 text-slate-900 font-bold ${
                  isSidebarCollapsed 
                    ? 'absolute top-1.5 right-2 px-1 py-0.2 rounded-full text-[9px]' 
                    : 'px-1.5 py-0.5 rounded text-[10px]'
                }`}>
                  {activeOutLogs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('employees');
                setMobileMenuOpen(false);
              }}
              title="Data Karyawan"
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3.5 py-2.5'} rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'employees'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-100 hover:bg-[#274770] hover:text-white'
              }`}
            >
              <Users className={`w-4 h-4 ${!isSidebarCollapsed ? 'mr-3 shrink-0' : ''}`} />
              {!isSidebarCollapsed && <span>Data Karyawan</span>}
            </button>

            <button
              onClick={() => {
                setActiveTab('reports');
                setMobileMenuOpen(false);
              }}
              title="Laporan & Cetak PDF"
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3.5 py-2.5'} rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-100 hover:bg-[#274770] hover:text-white'
              }`}
            >
              <FileText className={`w-4 h-4 ${!isSidebarCollapsed ? 'mr-3 shrink-0' : ''}`} />
              {!isSidebarCollapsed && <span>Laporan & Cetak PDF</span>}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 border-t border-blue-900/60 space-y-2">
          {/* Storage status button */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            title={supabaseConnected ? "Supabase Terhubung (Klik untuk konfigurasi)" : "Penyimpanan Lokal (Klik untuk konfigurasi)"}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'justify-between p-2'} rounded-lg bg-[#274770]/60 hover:bg-[#274770] text-[11px] text-blue-100 transition-colors cursor-pointer border border-blue-800/50`}
          >
            <div className="flex items-center space-x-2">
              <Database className="w-3.5 h-3.5 text-blue-300 shrink-0" />
              {!isSidebarCollapsed && (
                <span className="truncate">
                  {supabaseConnected ? 'Supabase Terhubung' : 'Penyimpanan Lokal'}
                </span>
              )}
            </div>
            {!isSidebarCollapsed && (
              <span className="text-[10px] text-blue-300 underline">Atur</span>
            )}
          </button>

          {/* Admin Profile & Logout */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center flex-col space-y-2' : 'justify-between'} pt-1 text-xs`}>
            {!isSidebarCollapsed ? (
              <div className="truncate pr-2">
                <div className="font-semibold text-white truncate">{admin.name}</div>
                <div className="text-[10px] text-blue-300 font-mono truncate">{admin.email}</div>
              </div>
            ) : (
              <div 
                className="w-7 h-7 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 cursor-pointer"
                title={`${admin.name} (${admin.email})`}
              >
                {admin.name.substring(0, 1).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={logout}
              title="Keluar dari sistem"
              className="p-1.5 text-blue-300 hover:text-white hover:bg-[#274770] rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT (60% Dominant Base: #f4f7fb) ================= */}
      <main className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            {/* Mobile menu trigger button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg mr-1 cursor-pointer"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop toggle sidebar button */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden md:inline-flex p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg mr-1 transition-colors cursor-pointer"
              title={isSidebarCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {activeTab === 'dashboard' && 'Dashboard Presensi'}
              {activeTab === 'inout' && 'Manajemen Jam Keluar Masuk'}
              {activeTab === 'employees' && 'Master Data Karyawan'}
              {activeTab === 'reports' && 'Laporan Harian PDF'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => loadData()}
              title="Perbarui data"
              disabled={isLoading}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Quick Add Outing button */}
            <button
              onClick={() => setIsTimeOutModalOpen(true)}
              className="hidden sm:inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              Catat Keluar
            </button>
          </div>
        </header>

        {/* Tab Body Content */}
        <div className="p-6 flex-1">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              employees={employees}
              workLogs={workLogs}
              inOutLogs={inOutLogs}
              selectedDate={selectedDate}
              onOpenTimeOutModal={() => {
                setIsTimeOutModalOpen(true);
              }}
              onOpenTimeInModal={(log) => {
                setSelectedLogForTimeIn(log || null);
                setIsTimeInModalOpen(true);
              }}
              onOpenReportTab={() => setActiveTab('reports')}
              onMarkAttendance={handleMarkAttendance}
              onUpdateWorkStatus={handleUpdateWorkStatus}
            />
          )}

          {activeTab === 'inout' && (
            <InOutTracker
              logs={inOutLogs}
              employees={employees}
              selectedDate={selectedDate}
              onSelectDate={(newDate) => setSelectedDate(newDate)}
              onOpenTimeOutModal={() => setIsTimeOutModalOpen(true)}
              onOpenTimeInModal={(log) => {
                setSelectedLogForTimeIn(log || null);
                setIsTimeInModalOpen(true);
              }}
              onDeleteLog={handleDeleteInOutLog}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeeManagement
              employees={employees}
              onAddEmployee={handleSaveEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onOpenAddModal={() => {
                setEditingEmployee(null);
                setIsEmployeeModalOpen(true);
              }}
              onEditEmployee={(emp) => {
                setEditingEmployee(emp);
                setIsEmployeeModalOpen(true);
              }}
            />
          )}

          {activeTab === 'reports' && (
            <DailyReportView
              selectedDate={selectedDate}
              onSelectDate={(newDate) => setSelectedDate(newDate)}
              employees={employees}
              workLogs={workLogs}
              inOutLogs={inOutLogs}
              adminName={admin.name}
            />
          )}
        </div>
      </main>

      {/* ================= MODALS ================= */}
      {/* 1. Modal Catat Jam Keluar */}
      <RecordTimeOutModal
        isOpen={isTimeOutModalOpen}
        onClose={() => setIsTimeOutModalOpen(false)}
        employees={employees}
        currentlyOutEmployeeIds={currentlyOutEmpIds}
        onSubmit={handleRecordTimeOut}
      />

      {/* 2. Modal Catat Jam Masuk & Kalkulasi Durasi + Warning */}
      <RecordTimeInModal
        isOpen={isTimeInModalOpen}
        onClose={() => {
          setIsTimeInModalOpen(false);
          setSelectedLogForTimeIn(null);
        }}
        activeLogs={activeOutLogs}
        selectedLog={selectedLogForTimeIn}
        onSubmit={handleRecordTimeIn}
      />

      {/* 3. Modal Tambah / Ubah Data Karyawan */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setEditingEmployee(null);
        }}
        initialData={editingEmployee}
        onSave={handleSaveEmployee}
      />

      {/* 4. Modal Konfigurasi Supabase */}
      <SupabaseSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSaved={() => loadData()}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
