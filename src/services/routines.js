import { DEFAULT_ITEMS, PRAYERS } from '../data/presets.js';
import { scheduled, dateKey } from './dates.js';
import { prayerTimes } from './prayers.js';
export function ensureDay(data, key) {
  let changed = false;
  if (!data.days[key]) {
    data.days[key] = { userId: data.userId, date: key, targetPages: data.settings.quranTargetPages, completedPages: 0,
      items: DEFAULT_ITEMS.map(templateKey => ({ id: `default:${templateKey}`, userId: data.userId, templateKey, source: 'default', category: 'ibadah', completed: false })) };
    changed = true;
  }
  const day = data.days[key];
  for (const task of data.tasks.filter(t => scheduled(t, key))) {
    if (day.items.some(i => i.id === task.id)) continue;
    day.items.push({ id: task.id, userId: data.userId, templateKey: task.id, source: 'custom', category: task.category, title: task.title,
      description: task.description, priority: task.priority, time: task.time, completed: false });
    changed = true;
  }
  return changed;
}
export function eligibleItems(day, key, settings, now = new Date()) {
  const currentDate = dateKey(now, settings.timezone);
  if (key > currentDate) return [];
  if (key < currentDate) return day.items;
  const times = prayerTimes(key, settings);
  const currentTime = new Intl.DateTimeFormat('en-GB', { timeZone: settings.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
  return day.items.filter(i => {
    const prayer = times.find(t => t.name === i.templateKey);
    if (PRAYERS.includes(i.templateKey) && prayer) return prayer.time <= now;
    const localTime = i.time || ({ morning: '06:00', evening: '17:00', duha: '08:00', bedtime: '21:00' }[i.templateKey]) || '00:00';
    // Compare explicit local date/time in the configured timezone, including DST.
    return localTime <= currentTime;
  });
}
export function habitSummary(data, start, end, now = new Date()) {
  const dates = Object.keys(data.days).filter(key => key >= start && key <= end && key <= dateKey(now, data.settings.timezone)).sort();
  let total = 0, completed = 0, pages = 0, targets = 0;
  const trend = dates.map(key => {
    const day = data.days[key], eligible = eligibleItems(day, key, data.settings, now);
    const done = eligible.filter(i => i.completed).length;
    total += eligible.length; completed += done; pages += day.completedPages;
    if (day.completedPages >= day.targetPages) targets++;
    return { date: key, total: eligible.length, completed: done, rate: eligible.length ? Math.round(done / eligible.length * 100) : null };
  });
  return { total, completed, rate: total ? Math.round(completed / total * 100) : null, pages, targets, trend,
    notes: Object.keys(data.notes).filter(key => key >= start && key <= end && data.notes[key].content).length };
}
