import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';
import { PRAYERS } from '../data/presets.js';
import { parseDate, addDays, dateKey } from './dates.js';
export function prayerTimes(key, settings) {
  if (settings.latitude === null || settings.longitude === null) return [];
  const params = CalculationMethod[settings.prayerMethod]();
  params.madhab = Madhab[settings.asrMethod];
  const times = new PrayerTimes(new Coordinates(settings.latitude, settings.longitude), parseDate(key), params);
  return PRAYERS.map(name => ({ name, time: new Date(times[name].getTime() + (settings.prayerOffsetsMinutes[name] || 0) * 60000) }));
}
export function nextPrayer(settings, now = new Date()) {
  const key = dateKey(now, settings.timezone);
  return [...prayerTimes(key, settings), ...prayerTimes(addDays(key, 1), settings)].find(p => p.time > now);
}
export function timeLabel(time, settings) {
  if (!time || Number.isNaN(time.getTime())) return '—';
  return new Intl.DateTimeFormat(settings.language === 'ar' ? 'ar-SA' : 'id-ID', { timeZone: settings.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(time);
}
export function countdown(time, now = new Date()) {
  const seconds = Math.max(0, Math.floor((time - now) / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, '0')).join(':');
}
