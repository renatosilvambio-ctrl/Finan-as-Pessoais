/**
 * Date and calendar utilities, including Brazilian business day calculations (5º dia útil).
 */

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MESES_ABREV = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

/**
 * Returns month formatted as "Novembro/2026"
 */
export function formatMonthYear(yearMonth: string): string {
  if (!yearMonth || !yearMonth.includes('-')) return '';
  const [yearStr, monthStr] = yearMonth.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthName = MESES[monthIdx] || monthStr;
  return `${monthName}/${yearStr}`;
}

export function formatMonthShort(yearMonth: string): string {
  if (!yearMonth || !yearMonth.includes('-')) return '';
  const [yearStr, monthStr] = yearMonth.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthName = MESES_ABREV[monthIdx] || monthStr;
  return `${monthName}/${yearStr.slice(2)}`;
}

export function formatMonthYearMedium(yearMonth: string): string {
  if (!yearMonth || !yearMonth.includes('-')) return '';
  const [yearStr, monthStr] = yearMonth.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthName = MESES_ABREV[monthIdx] || monthStr;
  return `${monthName} / ${yearStr}`;
}


/**
 * Adds N months to a "YYYY-MM" string.
 */
export function addMonths(yearMonth: string, count: number): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const totalMonths = y * 12 + (m - 1) + count;
  const newY = Math.floor(totalMonths / 12);
  const newM = (totalMonths % 12) + 1;
  return `${newY}-${String(newM).padStart(2, '0')}`;
}

/**
 * Gets current month as "YYYY-MM".
 */
export function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Gets today's date formatted as YYYY-MM-DD.
 */
export function getTodayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Formats YYYY-MM-DD as "DD/MM/YYYY".
 */
export function formatDateBR(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Computes Easter Sunday for a given year using Anonymous Gregorian algorithm.
 */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

/**
 * Returns an array of national holiday date strings (YYYY-MM-DD) for a given year.
 */
export function getBrazilianHolidays(year: number): Set<string> {
  const holidays = new Set<string>();

  // Fixed holidays
  const fixed = [
    `01-01`, // Confraternização Universal
    `04-21`, // Tiradentes
    `05-01`, // Dia do Trabalho
    `09-07`, // Independência do Brasil
    `10-12`, // Nossa Senhora Aparecida
    `11-02`, // Finados
    `11-15`, // Proclamação da República
    `11-20`, // Dia da Consciência Negra (Feriado Nacional desde 2024)
    `12-25`, // Natal
  ];

  fixed.forEach(date => holidays.add(`${year}-${date}`));

  // Mobile holidays based on Easter
  const easter = getEasterSunday(year);

  // Carnival Monday (-48 days) and Tuesday (-47 days)
  const carnivalMon = new Date(easter);
  carnivalMon.setDate(easter.getDate() - 48);
  holidays.add(formatISODate(carnivalMon));

  const carnivalTue = new Date(easter);
  carnivalTue.setDate(easter.getDate() - 47);
  holidays.add(formatISODate(carnivalTue));

  // Good Friday (-2 days)
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  holidays.add(formatISODate(goodFriday));

  // Corpus Christi (+60 days)
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);
  holidays.add(formatISODate(corpusChristi));

  return holidays;
}

function formatISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the exact date of the Nth business day of a month (Default 5th business day - "5º dia útil").
 * Excludes Saturdays, Sundays, and Brazilian national holidays.
 */
export function getQuintoDiaUtil(yearMonth: string, targetBusinessDay = 5): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed

  const holidays = getBrazilianHolidays(year);
  let businessDayCount = 0;
  const date = new Date(year, month, 1);

  while (date.getMonth() === month) {
    const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat
    const isoDate = formatISODate(date);

    // Business day: Monday (1) to Friday (5) and not a holiday
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !holidays.has(isoDate)) {
      businessDayCount++;
      if (businessDayCount === targetBusinessDay) {
        return isoDate;
      }
    }

    date.setDate(date.getDate() + 1);
  }

  // Fallback to 5th day of month if overflow
  return `${yearMonth}-05`;
}
