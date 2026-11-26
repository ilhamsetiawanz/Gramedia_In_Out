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

export function getCurrentTimeWithSeconds(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Menghitung selisih waktu dalam detik antara timeStartStr dan timeEndStr (format HH:mm atau HH:mm:ss)
 */
export function calculateSecondsDiff(timeStartStr: string, timeEndStr: string): number {
  if (!timeStartStr || !timeEndStr) return 0;

  const startParts = timeStartStr.split(':').map((n) => Number(n) || 0);
  const endParts = timeEndStr.split(':').map((n) => Number(n) || 0);

  const startTotalSeconds = (startParts[0] || 0) * 3600 + (startParts[1] || 0) * 60 + (startParts[2] || 0);
  const endTotalSeconds = (endParts[0] || 0) * 3600 + (endParts[1] || 0) * 60 + (endParts[2] || 0);

  let diff = endTotalSeconds - startTotalSeconds;
  // Handle jika melewati tengah malam
  if (diff < 0) {
    diff += 24 * 3600;
  }
  return diff;
}

/**
 * Format detik menjadi stopwatch MM:SS atau HH:MM:SS
 */
export function formatElapsedTimer(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) {
    const hh = String(hours).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
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
  return Math.floor(calculateSecondsDiff(timeStartStr, timeEndStr) / 60);
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
): { isOverdue: boolean; currentDuration: number; currentSeconds: number; excessMinutes: number; excessSeconds: number } {
  const currentOrEndTime = timeIn || getCurrentTimeWithSeconds();
  const currentSeconds = calculateSecondsDiff(timeOut, currentOrEndTime);
  const currentDuration = Math.floor(currentSeconds / 60);
  const excessSeconds = Math.max(0, currentSeconds - maxMinutes * 60);
  const excessMinutes = Math.max(0, currentDuration - maxMinutes);

  return {
    isOverdue: excessSeconds > 0,
    currentDuration,
    currentSeconds,
    excessMinutes,
    excessSeconds,
  };
}
