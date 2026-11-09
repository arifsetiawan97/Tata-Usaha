/**
 * Utility helper untuk kalender nasional Indonesia, hari libur nasional,
 * cuti bersama, libur keagamaan (Ramadhan / Idul Fitri), dan penguncian hari kerja.
 */

export interface HolidayItem {
  date: string; // YYYY-MM-DD
  name: string;
  type: 'nasional' | 'cuti_bersama' | 'libur_sekolah' | 'puasa_ramadhan';
}

// Data Hari Libur Nasional & Cuti Bersama Resmi Indonesia (2024 - 2028)
export const INDONESIAN_HOLIDAYS: Record<string, HolidayItem> = {
  // === TAHUN 2025 ===
  '2025-01-01': { date: '2025-01-01', name: 'Tahun Baru 2025 Masehi', type: 'nasional' },
  '2025-01-27': { date: '2025-01-27', name: 'Isra Mi\'raj Nabi Muhammad SAW', type: 'nasional' },
  '2025-01-28': { date: '2025-01-28', name: 'Cuti Bersama Tahun Baru Imlek', type: 'cuti_bersama' },
  '2025-01-29': { date: '2025-01-29', name: 'Tahun Baru Imlek 2576 Kongzili', type: 'nasional' },
  '2025-02-28': { date: '2025-02-28', name: 'Libur Awal Puasa Ramadhan 1446 H', type: 'puasa_ramadhan' },
  '2025-03-01': { date: '2025-03-01', name: 'Libur Awal Puasa Ramadhan 1446 H', type: 'puasa_ramadhan' },
  '2025-03-03': { date: '2025-03-03', name: 'Libur Khusus Awal Ramadhan 1446 H', type: 'puasa_ramadhan' },
  '2025-03-28': { date: '2025-03-28', name: 'Cuti Bersama Hari Suci Nyepi', type: 'cuti_bersama' },
  '2025-03-29': { date: '2025-03-29', name: 'Hari Suci Nyepi (Tahun Baru Saka 1947)', type: 'nasional' },
  '2025-03-31': { date: '2025-03-31', name: 'Hari Raya Idul Fitri 1446 H (Hari Ke-1)', type: 'nasional' },
  '2025-04-01': { date: '2025-04-01', name: 'Hari Raya Idul Fitri 1446 H (Hari Ke-2)', type: 'nasional' },
  '2025-04-02': { date: '2025-04-02', name: 'Cuti Bersama Hari Raya Idul Fitri 1446 H', type: 'cuti_bersama' },
  '2025-04-03': { date: '2025-04-03', name: 'Cuti Bersama Hari Raya Idul Fitri 1446 H', type: 'cuti_bersama' },
  '2025-04-04': { date: '2025-04-04', name: 'Cuti Bersama Hari Raya Idul Fitri 1446 H', type: 'cuti_bersama' },
  '2025-04-07': { date: '2025-04-07', name: 'Cuti Bersama Hari Raya Idul Fitri 1446 H', type: 'cuti_bersama' },
  '2025-04-18': { date: '2025-04-18', name: 'Wafat Yesus Kristus (Jumat Agung)', type: 'nasional' },
  '2025-04-20': { date: '2025-04-20', name: 'Hari Paskah', type: 'nasional' },
  '2025-05-01': { date: '2025-05-01', name: 'Hari Buruh Internasional', type: 'nasional' },
  '2025-05-12': { date: '2025-05-12', name: 'Hari Raya Waisak 2569 BE', type: 'nasional' },
  '2025-05-13': { date: '2025-05-13', name: 'Cuti Bersama Hari Raya Waisak', type: 'cuti_bersama' },
  '2025-05-29': { date: '2025-05-29', name: 'Kenaikan Yesus Kristus', type: 'nasional' },
  '2025-05-30': { date: '2025-05-30', name: 'Cuti Bersama Kenaikan Yesus Kristus', type: 'cuti_bersama' },
  '2025-06-01': { date: '2025-06-01', name: 'Hari Lahir Pancasila', type: 'nasional' },
  '2025-06-06': { date: '2025-06-06', name: 'Hari Raya Idul Adha 1446 H', type: 'nasional' },
  '2025-06-09': { date: '2025-06-09', name: 'Cuti Bersama Hari Raya Idul Adha', type: 'cuti_bersama' },
  '2025-06-27': { date: '2025-06-27', name: 'Tahun Baru Islam 1447 Hijriah', type: 'nasional' },
  '2025-08-17': { date: '2025-08-17', name: 'Hari Proklamasi Kemerdekaan RI ke-80', type: 'nasional' },
  '2025-09-05': { date: '2025-09-05', name: 'Maulid Nabi Muhammad SAW', type: 'nasional' },
  '2025-12-25': { date: '2025-12-25', name: 'Hari Raya Natal', type: 'nasional' },
  '2025-12-26': { date: '2025-12-26', name: 'Cuti Bersama Hari Raya Natal', type: 'cuti_bersama' },

  // === TAHUN 2026 ===
  '2026-01-01': { date: '2026-01-01', name: 'Tahun Baru 2026 Masehi', type: 'nasional' },
  '2026-01-16': { date: '2026-01-16', name: 'Isra Mi\'raj Nabi Muhammad SAW', type: 'nasional' },
  '2026-02-16': { date: '2026-02-16', name: 'Cuti Bersama Tahun Baru Imlek', type: 'cuti_bersama' },
  '2026-02-17': { date: '2026-02-17', name: 'Tahun Baru Imlek 2577 Kongzili', type: 'nasional' },
  '2026-02-18': { date: '2026-02-18', name: 'Libur Khusus Awal Puasa Ramadhan 1447 H', type: 'puasa_ramadhan' },
  '2026-02-19': { date: '2026-02-19', name: 'Libur Khusus Awal Puasa Ramadhan 1447 H', type: 'puasa_ramadhan' },
  '2026-02-20': { date: '2026-02-20', name: 'Libur Khusus Awal Puasa Ramadhan 1447 H', type: 'puasa_ramadhan' },
  '2026-03-19': { date: '2026-03-19', name: 'Hari Suci Nyepi (Tahun Baru Saka 1948)', type: 'nasional' },
  '2026-03-20': { date: '2026-03-20', name: 'Hari Raya Idul Fitri 1447 H (Hari Ke-1)', type: 'nasional' },
  '2026-03-21': { date: '2026-03-21', name: 'Hari Raya Idul Fitri 1447 H (Hari Ke-2)', type: 'nasional' },
  '2026-03-23': { date: '2026-03-23', name: 'Cuti Bersama Idul Fitri 1447 H', type: 'cuti_bersama' },
  '2026-03-24': { date: '2026-03-24', name: 'Cuti Bersama Idul Fitri 1447 H', type: 'cuti_bersama' },
  '2026-03-25': { date: '2026-03-25', name: 'Cuti Bersama Idul Fitri 1447 H', type: 'cuti_bersama' },
  '2026-04-03': { date: '2026-04-03', name: 'Wafat Yesus Kristus (Jumat Agung)', type: 'nasional' },
  '2026-04-05': { date: '2026-04-05', name: 'Hari Paskah', type: 'nasional' },
  '2026-05-01': { date: '2026-05-01', name: 'Hari Buruh Internasional', type: 'nasional' },
  '2026-05-14': { date: '2026-05-14', name: 'Kenaikan Yesus Kristus', type: 'nasional' },
  '2026-05-15': { date: '2026-05-15', name: 'Cuti Bersama Kenaikan Yesus Kristus', type: 'cuti_bersama' },
  '2026-05-27': { date: '2026-05-27', name: 'Hari Raya Idul Adha 1447 H', type: 'nasional' },
  '2026-05-28': { date: '2026-05-28', name: 'Cuti Bersama Hari Raya Idul Adha', type: 'cuti_bersama' },
  '2026-05-31': { date: '2026-05-31', name: 'Hari Raya Waisak 2570 BE', type: 'nasional' },
  '2026-06-01': { date: '2026-06-01', name: 'Hari Lahir Pancasila', type: 'nasional' },
  '2026-06-16': { date: '2026-06-16', name: 'Tahun Baru Islam 1448 Hijriah', type: 'nasional' },
  '2026-08-17': { date: '2026-08-17', name: 'Hari Proklamasi Kemerdekaan RI ke-81', type: 'nasional' },
  '2026-08-25': { date: '2026-08-25', name: 'Maulid Nabi Muhammad SAW', type: 'nasional' },
  '2026-12-25': { date: '2026-12-25', name: 'Hari Raya Natal', type: 'nasional' },
  '2026-12-26': { date: '2026-12-26', name: 'Cuti Bersama Hari Raya Natal', type: 'cuti_bersama' },

  // === TAHUN 2027 ===
  '2027-01-01': { date: '2027-01-01', name: 'Tahun Baru 2027 Masehi', type: 'nasional' },
  '2027-01-06': { date: '2027-01-06', name: 'Isra Mi\'raj Nabi Muhammad SAW', type: 'nasional' },
  '2027-02-06': { date: '2027-02-06', name: 'Tahun Baru Imlek 2578 Kongzili', type: 'nasional' },
  '2027-02-08': { date: '2027-02-08', name: 'Libur Khusus Awal Puasa Ramadhan 1448 H', type: 'puasa_ramadhan' },
  '2027-03-09': { date: '2027-03-09', name: 'Hari Suci Nyepi (Tahun Baru Saka 1949)', type: 'nasional' },
  '2027-03-10': { date: '2027-03-10', name: 'Hari Raya Idul Fitri 1448 H', type: 'nasional' },
  '2027-03-11': { date: '2027-03-11', name: 'Hari Raya Idul Fitri 1448 H (Hari Ke-2)', type: 'nasional' },
  '2027-03-26': { date: '2027-03-26', name: 'Wafat Yesus Kristus', type: 'nasional' },
  '2027-05-01': { date: '2027-05-01', name: 'Hari Buruh Internasional', type: 'nasional' },
  '2027-05-06': { date: '2027-05-06', name: 'Kenaikan Yesus Kristus', type: 'nasional' },
  '2027-05-20': { date: '2027-05-20', name: 'Hari Raya Waisak 2571 BE', type: 'nasional' },
  '2027-05-17': { date: '2027-05-17', name: 'Hari Raya Idul Adha 1448 H', type: 'nasional' },
  '2027-06-01': { date: '2027-06-01', name: 'Hari Lahir Pancasila', type: 'nasional' },
  '2027-06-06': { date: '2027-06-06', name: 'Tahun Baru Islam 1449 Hijriah', type: 'nasional' },
  '2027-08-17': { date: '2027-08-17', name: 'Hari Proklamasi Kemerdekaan RI ke-82', type: 'nasional' },
  '2027-08-15': { date: '2027-08-15', name: 'Maulid Nabi Muhammad SAW', type: 'nasional' },
  '2027-12-25': { date: '2027-12-25', name: 'Hari Raya Natal', type: 'nasional' },

  // === TAHUN 2024 (Histori) ===
  '2024-01-01': { date: '2024-01-01', name: 'Tahun Baru 2024 Masehi', type: 'nasional' },
  '2024-02-08': { date: '2024-02-08', name: 'Isra Mi\'raj Nabi Muhammad SAW', type: 'nasional' },
  '2024-02-10': { date: '2024-02-10', name: 'Tahun Baru Imlek 2575 Kongzili', type: 'nasional' },
  '2024-03-11': { date: '2024-03-11', name: 'Hari Suci Nyepi', type: 'nasional' },
  '2024-03-12': { date: '2024-03-12', name: 'Libur Awal Puasa Ramadhan 1445 H', type: 'puasa_ramadhan' },
  '2024-03-29': { date: '2024-03-29', name: 'Wafat Yesus Kristus', type: 'nasional' },
  '2024-04-10': { date: '2024-04-10', name: 'Hari Raya Idul Fitri 1445 H', type: 'nasional' },
  '2024-04-11': { date: '2024-04-11', name: 'Hari Raya Idul Fitri 1445 H (Hari Ke-2)', type: 'nasional' },
  '2024-05-01': { date: '2024-05-01', name: 'Hari Buruh Internasional', type: 'nasional' },
  '2024-05-09': { date: '2024-05-09', name: 'Kenaikan Yesus Kristus', type: 'nasional' },
  '2024-05-23': { date: '2024-05-23', name: 'Hari Raya Waisak 2568 BE', type: 'nasional' },
  '2024-06-01': { date: '2024-06-01', name: 'Hari Lahir Pancasila', type: 'nasional' },
  '2024-06-17': { date: '2024-06-17', name: 'Hari Raya Idul Adha 1445 H', type: 'nasional' },
  '2024-07-07': { date: '2024-07-07', name: 'Tahun Baru Islam 1446 Hijriah', type: 'nasional' },
  '2024-08-17': { date: '2024-08-17', name: 'Hari Proklamasi Kemerdekaan RI', type: 'nasional' },
  '2024-09-16': { date: '2024-09-16', name: 'Maulid Nabi Muhammad SAW', type: 'nasional' },
  '2024-12-25': { date: '2024-12-25', name: 'Hari Raya Natal', type: 'nasional' }
};

/**
 * Cek apakah sebuah tanggal (YYYY-MM-DD) merupakan hari libur nasional atau cuti bersama
 */
export function checkIndonesianHoliday(dateStr: string): HolidayItem | null {
  // 1. Cek langsung dari kamus resmi
  if (INDONESIAN_HOLIDAYS[dateStr]) {
    return INDONESIAN_HOLIDAYS[dateStr];
  }

  // 2. Cek hari libur tanggal tetap (Tahun Baru 1 Jan, Buruh 1 Mei, Pancasila 1 Jun, RI 17 Agt, Natal 25 Des)
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const mmdd = `${monthStr}-${dayStr}`;

  if (mmdd === '01-01') {
    return { date: dateStr, name: `Tahun Baru ${yearStr} Masehi`, type: 'nasional' };
  }
  if (mmdd === '05-01') {
    return { date: dateStr, name: 'Hari Buruh Internasional', type: 'nasional' };
  }
  if (mmdd === '06-01') {
    return { date: dateStr, name: 'Hari Lahir Pancasila', type: 'nasional' };
  }
  if (mmdd === '08-17') {
    return { date: dateStr, name: `Hari Proklamasi Kemerdekaan RI (${yearStr})`, type: 'nasional' };
  }
  if (mmdd === '12-25') {
    return { date: dateStr, name: 'Hari Raya Natal', type: 'nasional' };
  }
  if (mmdd === '12-26') {
    return { date: dateStr, name: 'Cuti Bersama Hari Raya Natal', type: 'cuti_bersama' };
  }

  return null;
}

export interface DayCalendarInfo {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  dayOfWeek: number; // 0: Minggu, 1: Senin, ..., 6: Sabtu
  dayName: string; // 'Senin', 'Selasa', dll.
  weekOfMonth: number; // 1 s/d 5
  isSunday: boolean;
  isSaturday: boolean;
  isNationalHoliday: boolean;
  holidayName?: string;
  isUserLocked: boolean;
  lockReason?: string;
  isActiveWorkday: boolean; // Dapat diisi tugas operasional jika true
}

const INDO_DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * Bangun daftar kalender lengkap untuk satu bulan tertentu dengan deteksi
 * Hari Minggu, Libur Nasional, Cuti Bersama, dan Tanggal Terkunci Pengguna.
 */
export function buildMonthCalendarDays(
  year: number,
  month: number, // 1-12
  workdayMode: 'senin-sabtu' | 'senin-jumat',
  lockedDatesSet: Set<string>
): DayCalendarInfo[] {
  const result: DayCalendarInfo[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay();
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;

    const yStr = String(year);
    const mStr = String(month).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const dateStr = `${yStr}-${mStr}-${dStr}`;

    // Cek libur nasional / cuti bersama
    const holiday = checkIndonesianHoliday(dateStr);
    const isNationalHoliday = !!holiday;
    const holidayName = holiday ? holiday.name : undefined;

    // Cek kunci manual oleh pengguna (misal: libur puasa, dinas khusus)
    const isUserLocked = lockedDatesSet.has(dateStr);

    // Hitung minggu ke-n dalam bulan (Minggu 1: tgl 1-7, Minggu 2: tgl 8-14, dst)
    const weekOfMonth = Math.min(5, Math.floor((d - 1) / 7) + 1);

    // Tentukan apakah hari kerja aktif:
    // Bukan hari minggu, bukan hari sabtu jika mode 5 hari, bukan libur nasional, dan tidak dikunci
    let isActiveWorkday = true;
    if (isSunday) {
      isActiveWorkday = false;
    } else if (workdayMode === 'senin-jumat' && isSaturday) {
      isActiveWorkday = false;
    } else if (isNationalHoliday) {
      isActiveWorkday = false;
    } else if (isUserLocked) {
      isActiveWorkday = false;
    }

    result.push({
      dateStr,
      dayNumber: d,
      dayOfWeek,
      dayName: INDO_DAY_NAMES[dayOfWeek],
      weekOfMonth,
      isSunday,
      isSaturday,
      isNationalHoliday,
      holidayName,
      isUserLocked,
      lockReason: isUserLocked ? 'Dikunci oleh pengguna' : undefined,
      isActiveWorkday
    });
  }

  return result;
}
