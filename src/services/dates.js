export function dateKey(date = new Date(), timezone = 'Asia/Jakarta') {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  return ['year', 'month', 'day'].map(k => parts.find(p => p.type === k).value).join('-');
}
export const parseDate = key => new Date(`${key}T12:00:00`);
export function addDays(key, amount) {
  const d = parseDate(key); d.setDate(d.getDate() + amount);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const weekday = key => parseDate(key).getDay();
export function hijri(key, offset = 0, language = 'id') {
  const d = parseDate(addDays(key, offset));
  const format = new Intl.DateTimeFormat(`${language === 'ar' ? 'ar-SA' : 'id-ID'}-u-ca-islamic-umalqura`, { day: 'numeric', month: 'long', year: 'numeric' });
  const numeric = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(d);
  const num = k => Number(numeric.find(p => p.type === k)?.value);
  return { label: format.format(d), day: num('day'), month: num('month'), year: num('year') };
}
export function gregorian(key, language = 'id', options = {}) {
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA-u-ca-gregory' : 'id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', ...options }).format(parseDate(key));
}
export function monthRange(month) {
  const [year, m] = month.split('-').map(Number);
  return { start: `${month}-01`, end: `${month}-${new Date(year, m, 0).getDate()}` };
}
export function periodRange(key, period, weekStartsOn = 1) {
  if (period === 'daily') return { start: key, end: key };
  if (period === 'monthly') return monthRange(key.slice(0, 7));
  const start = addDays(key, -((weekday(key) - weekStartsOn + 7) % 7));
  return { start, end: addDays(start, 6) };
}
export function fastingTypes(key, settings) {
  const types = [];
  if (weekday(key) === 1 && settings.enableMondayFastReminder) types.push('monday');
  if (weekday(key) === 4 && settings.enableThursdayFastReminder) types.push('thursday');
  const day = hijri(key, settings.hijriOffsetDays).day;
  if ([13, 14, 15].includes(day) && settings.enableAyyamulBidhReminder) types.push('ayyamul_bidh');
  return types;
}
export function hijriMonthRange(key, offset = 0) {
  const h = hijri(key, offset), start = addDays(key, 1 - h.day);
  let next = addDays(start, 29);
  if (hijri(next, offset).month === h.month) next = addDays(next, 1);
  return { start, end: addDays(next, -1), next, length: hijri(addDays(next, -1), offset).day };
}
export function hijriMonthLabel(key, offset = 0, language = 'id') {
  return new Intl.DateTimeFormat(`${language === 'ar' ? 'ar-SA' : 'id-ID'}-u-ca-islamic-umalqura`, { month: 'long', year: 'numeric' }).format(parseDate(addDays(key, offset)));
}
export function fromHijri(year, month, day, offset = 0) {
  if (![year, month, day].every(Number.isSafeInteger) || month < 1 || month > 12 || day < 1 || day > 30) return null;
  const wanted = year * 372 + month * 31 + day;
  let low = 0, high = Math.round((Date.UTC(2200, 11, 31) - Date.UTC(1900, 0, 1)) / 86400000);
  while (low <= high) {
    const middle = Math.floor((low + high) / 2), key = addDays('1900-01-01', middle), h = hijri(key, offset);
    const value = h.year * 372 + h.month * 31 + h.day;
    if (value === wanted) return key <= '2200-12-31' ? key : null;
    if (value < wanted) low = middle + 1; else high = middle - 1;
  }
  return null;
}
export function hijriPeriodRange(key, period, weekStartsOn = 1, offset = 0) {
  return period === 'monthly' ? hijriMonthRange(key, offset) : periodRange(key, period, weekStartsOn);
}
export function scheduled(task, key, offset = 0) {
  if (!task.active || key < task.date) return false;
  if (task.scheduleType === 'once') return key === task.date;
  if (task.scheduleType === 'daily') return true;
  if (task.scheduleType === 'weekly') return task.weekdays.includes(weekday(key));
  if (task.calendar === 'hijri') return hijri(key, offset).day === Math.min(hijri(task.date, offset).day, hijriMonthRange(key, offset).length);
  const d = parseDate(key), target = Math.min(Number(task.date.slice(8)), new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate());
  return d.getDate() === target;
}
