/**
 * Utility fungsi tanggal dan waktu
 */

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatIndonesianDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Menghitung selisih waktu dalam menit antara timeOut dan timeIn (format HH:mm atau HH:mm:ss)
 */
export function calculateMinutesDiff(timeStartStr: string, timeEndStr: string): number {
  if (!timeStartStr || !timeEndStr) return 0;
  
  const [startH, startM] = timeStartStr.split(':').map(Number);
  const [endH, endM] = timeEndStr.split(':').map(Number);

  const startTotalMinutes = startH * 60 + startM;
  const endTotalMinutes = endH * 60 + endM;

  let diff = endTotalMinutes - startTotalMinutes;
  // Handle jika melewati tengah malam (misal shift malam)
  if (diff < 0) {
    diff += 24 * 60;
  }
  return diff;
}

/**
 * Format menit menjadi format ramah pengguna: e.g. "1 jam 15 menit" atau "45 menit"
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || minutes < 0) return '-';
  if (minutes === 0) return '0 menit';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours} jam ${remainingMinutes} menit`;
  }
  if (hours > 0) {
    return `${hours} jam`;
  }
  return `${remainingMinutes} menit`;
}

/**
 * Cek apakah durasi istirahat saat ini (live atau sudah selesai) melebihi batas
 */
export function checkIsOverdue(
  timeOut: string,
  timeIn: string | null,
  maxMinutes: number = 60
): { isOverdue: boolean; currentDuration: number; excessMinutes: number } {
  const currentOrEndTime = timeIn || getCurrentTimeString();
  const currentDuration = calculateMinutesDiff(timeOut, currentOrEndTime);
  const excess = currentDuration - maxMinutes;
  
  return {
    isOverdue: excess > 0,
    currentDuration,
    excessMinutes: Math.max(0, excess),
  };
}
