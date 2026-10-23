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
export function scheduled(task, key) {
  if (!task.active || key < task.date) return false;
  if (task.scheduleType === 'once') return key === task.date;
  if (task.scheduleType === 'daily') return true;
  if (task.scheduleType === 'weekly') return task.weekdays.includes(weekday(key));
  const d = parseDate(key), target = Math.min(Number(task.date.slice(8)), new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate());
  return d.getDate() === target;
}
