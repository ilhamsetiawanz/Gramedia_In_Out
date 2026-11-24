import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Employee, InOutLog, DailyWorkLog } from '../types';
import { formatIndonesianDate, formatDuration } from '../utils/dateUtils';

interface GenerateDailyReportOptions {
  date: string;
  employees: Employee[];
  workLogs: DailyWorkLog[];
  inOutLogs: InOutLog[];
  adminName?: string;
}

export function generateDailyPDFReport({
  date,
  employees,
  workLogs,
  inOutLogs,
  adminName = 'Administrator Gramedia',
}: GenerateDailyReportOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const empMap = new Map(employees.map((e) => [e.id, e]));
  const formattedDate = formatIndonesianDate(date);
  const now = new Date();
  const printTimestamp = `${now.toLocaleDateString('id-ID')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

  // Total violations
  const overdueLogs = inOutLogs.filter((l) => {
    if (l.purpose !== 'Istirahat') return false;
    const emp = empMap.get(l.employee_id);
    const max = emp?.max_break_minutes || 60;
    return l.is_overdue || (l.duration_minutes !== null && l.duration_minutes > max);
  });

  // ================= 1. HEADER KOP DOKUMEN =================
  // Header background banner (deep pastel navy: #1E3A5F -> rgb(30, 58, 95))
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, 210, 26, 'F');

  // Text title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('LAPORAN HARIAN PRESENSI & KELUAR MASUK KARYAWAN', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 220, 245);
  doc.text('PT GRAMEDIA ASRI MEDIA - SISTEM MONITORING WAKTU KERJA & ISTIRAHAT', 14, 18);

  // Meta info below header
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.text(`Tanggal Laporan : ${formattedDate}`, 14, 33);
  doc.text(`Dicetak Oleh       : ${adminName}`, 14, 38);
  doc.text(`Waktu Cetak       : ${printTimestamp}`, 140, 33);

  // Divider line
  doc.setDrawColor(219, 228, 238);
  doc.setLineWidth(0.4);
  doc.line(14, 42, 196, 42);

  // ================= 2. RINGKASAN METRIK (SUMMARY BOX) =================
  doc.setFillColor(244, 247, 251); // #F4F7FB
  doc.roundedRect(14, 45, 182, 18, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 45, 182, 18, 2, 2, 'D');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL KARYAWAN', 22, 51);
  doc.text('HADIR BEKERJA', 68, 51);
  doc.text('AKTIVITAS KELUAR', 116, 51);
  doc.text('PELANGGARAN ISTIRAHAT', 155, 51);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 95);
  doc.text(`${employees.length} Orang`, 22, 58);
  doc.text(`${workLogs.length} Orang`, 68, 58);
  doc.text(`${inOutLogs.length} Kali`, 116, 58);

  // Pelanggaran text color
  if (overdueLogs.length > 0) {
    doc.setTextColor(185, 28, 28); // #B91C1C red
    doc.text(`${overdueLogs.length} Pelanggaran`, 155, 58);
  } else {
    doc.setTextColor(21, 128, 61); // green
    doc.text('0 (Tertib)', 155, 58);
  }

  // ================= 3. TABEL 1: DAFTAR KARYAWAN BEKERJA HARI INI =================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 95);
  doc.text('1. DAFTAR KARYAWAN YANG MASUK / BEKERJA PADA HARI INI', 14, 71);

  // Filter khusus karyawan yang hadir/masuk pada hari tersebut
  const workingEmployees = employees.filter((emp) => 
    workLogs.some((w) => w.employee_id === emp.id)
  );

  const workTableBody = workingEmployees.length === 0
    ? [['-', '-', 'Belum ada karyawan yang melakukan Clock In pada tanggal ini', '-', '-', '-', '-', '-']]
    : workingEmployees.map((emp, index) => {
        const workLog = workLogs.find((w) => w.employee_id === emp.id);
        const activeOut = inOutLogs.find((l) => l.employee_id === emp.id && !l.time_in);
        
        let statusText = 'Bekerja di Tempat';
        if (workLog?.status === 'completed') statusText = 'Selesai Shift';
        else if (activeOut) statusText = `Di Luar (${activeOut.purpose})`;

        const shiftDisplay = workLog?.shift_name || workLog?.notes || 'Shift Pagi';

        return [
          String(index + 1),
          emp.nik || emp.nip || '-',
          emp.name,
          emp.department,
          shiftDisplay,
          workLog?.shift_start || '-',
          workLog?.shift_end || '-',
          statusText,
        ];
      });

  autoTable(doc, {
    startY: 74,
    head: [['No', 'NIK', 'Nama Karyawan', 'Departemen', 'Shift Kerja', 'Clock In', 'Clock Out', 'Status']],
    body: workTableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 95],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 18 },
      2: { fontStyle: 'bold', cellWidth: 38 },
      3: { cellWidth: 38 },
      4: { halign: 'center', fontStyle: 'bold', cellWidth: 24 },
      5: { halign: 'center', cellWidth: 17 },
      6: { halign: 'center', cellWidth: 17 },
      7: { halign: 'center', cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
  });

  // ================= 4. TABEL 2: RINCIAN PENCATATAN JAM KELUAR MASUK =================
  const finalY1 = (doc as any).lastAutoTable?.finalY || 130;
  
  // Periksa apakah sisa ruang cukup untuk tabel 2
  let startY2 = finalY1 + 10;
  if (startY2 > 240) {
    doc.addPage();
    startY2 = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 95);
  doc.text('2. RINCIAN PENCATATAN JAM KELUAR MASUK & KEPATUHAN WAKTU ISTIRAHAT', 14, startY2);

  const inOutTableBody = inOutLogs.length === 0
    ? [['-', '-', 'Tidak ada aktivitas keluar masuk pada tanggal ini', '-', '-', '-', '-']]
    : inOutLogs.map((log, index) => {
        const emp = empMap.get(log.employee_id);
        const maxBreak = emp?.max_break_minutes || 60;
        const duration = log.duration_minutes !== null ? log.duration_minutes : 0;
        const isBreak = log.purpose === 'Istirahat';
        const isOverdue = isBreak && (log.is_overdue || (log.duration_minutes !== null && duration > maxBreak));
        const excess = Math.max(0, duration - maxBreak);

        let statusText = 'Tepat Waktu';
        if (!log.time_in) {
          statusText = 'Sedang Berada di Luar';
        } else if (isOverdue) {
          statusText = `[PERINGATAN] Lewat ${excess} mnt`;
        } else if (!isBreak) {
          statusText = 'Tugas Selesai';
        }

        return [
          String(index + 1),
          `${emp?.name || 'Karyawan'} (${emp?.nik || emp?.nip || '-'})`,
          log.purpose + (log.notes ? `\n(${log.notes})` : ''),
          log.time_out,
          log.time_in || 'Belum Masuk',
          log.duration_minutes !== null ? `${formatDuration(log.duration_minutes)}` : 'Sedang berjalan',
          isBreak ? `${maxBreak} Menit` : '-',
          statusText,
        ];
      });

  autoTable(doc, {
    startY: startY2 + 3,
    head: [['No', 'Karyawan', 'Keperluan & Catatan', 'Jam Keluar', 'Jam Masuk', 'Total Waktu', 'Batas', 'Status / Peringatan']],
    body: inOutTableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 95],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 40 },
      2: { cellWidth: 40 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'center', cellWidth: 15 },
      7: { halign: 'center', cellWidth: 23 },
    },
    didParseCell: (data) => {
      // Highlight warning cell in red/amber if overdue
      if (data.section === 'body' && data.column.index === 7) {
        const text = String(data.cell.raw);
        if (text.includes('[PERINGATAN]')) {
          data.cell.styles.textColor = [185, 28, 28]; // red
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [254, 242, 242]; // pastel red tint
        } else if (text.includes('Sedang Berada di Luar')) {
          data.cell.styles.textColor = [37, 99, 235]; // blue
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ================= 5. TANDA TANGAN (SIGNATURE BLOCK) =================
  let finalY2 = (doc as any).lastAutoTable?.finalY || 200;
  if (finalY2 > 230) {
    doc.addPage();
    finalY2 = 20;
  }

  const signY = finalY2 + 15;
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');

  doc.text(`Kendari, ${formattedDate}`, 135, signY - 5);
  doc.text('Mengetahui / Menyetujui,', 135, signY);
  doc.text('Store Manager Gramedia Kendari', 135, signY + 5);

  doc.line(135, signY + 28, 195, signY + 28);
  doc.setFont('helvetica', 'bold');
  doc.text(adminName || 'Gramedia Kendari', 135, signY + 33);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Pimpinan Toko / Admin Operasional', 135, signY + 37);

  // Footer text on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Dokumen Resmi Sistem Presensi Gramedia • Halaman ${i} dari ${totalPages}`,
      14,
      290
    );
  }

  // Trigger browser download
  const cleanDate = date.replace(/-/g, '');
  doc.save(`Laporan_Presensi_Keluar_Masuk_Gramedia_${cleanDate}.pdf`);
}
