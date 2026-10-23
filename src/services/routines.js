import { DEFAULT_ITEMS, PRAYERS } from '../data/presets.js';
import { scheduled, dateKey } from './dates.js';
import { prayerTimes } from './prayers.js';
export function updateQuranProgress(data, key, completedPages, targetPages = data.days[key]?.targetPages) {
  if (!Number.isSafeInteger(completedPages) || completedPages < 0 || completedPages > 100000 || !Number.isSafeInteger(targetPages) || targetPages < 1 || targetPages > 1000) throw new Error('INVALID_QURAN_PROGRESS');
  ensureDay(data, key);
  const day = data.days[key];
  day.targetPages = targetPages; day.completedPages = completedPages;
  const item = day.items.find(i => i.templateKey === 'quran');
  if (item) {
    item.completed = completedPages >= targetPages;
    item.updatedAt = new Date().toISOString();
    item.completedAt = item.completed ? item.updatedAt : null;
  }
}
export function updateQuranTarget(data, target, effectiveDate) {
  if (!Number.isSafeInteger(target) || target < 1 || target > 1000) throw new Error('INVALID_QURAN_TARGET');
  data.settings.quranTargetPages = target;
  for (const [key, day] of Object.entries(data.days)) if (key >= effectiveDate) updateQuranProgress(data, key, day.completedPages, target);
}
export function setItemCompletion(data, key, id, completed) {
  ensureDay(data, key);
  const item = data.days[key].items.find(i => i.id === id);
  if (!item || PRAYERS.includes(item.templateKey)) return;
  if (item.templateKey === 'quran') {
    const day = data.days[key];
    updateQuranProgress(data, key, completed ? Math.max(day.completedPages, day.targetPages) : 0);
  } else {
    item.completed = completed; item.updatedAt = new Date().toISOString(); item.completedAt = completed ? item.updatedAt : null;
  }
}
export function removePlannerTemplate(data, id, collection, effectiveDate) {
  if (!['tasks', 'habits'].includes(collection)) throw new Error('INVALID_COLLECTION');
  data[collection] = data[collection].filter(row => row.id !== id);
  for (const [key, day] of Object.entries(data.days)) if (key >= effectiveDate) day.items = day.items.filter(item => item.id !== id || item.completed);
}
export function ensureDay(data, key) {
  let changed = false;
  if (!data.days[key]) {
    data.days[key] = { userId: data.userId, date: key, targetPages: data.settings.quranTargetPages, completedPages: 0,
      items: [] };
    changed = true;
  }
  const day = data.days[key];
  for (const habit of (data.habits || []).filter(h => scheduled(h, key, data.settings.hijriOffsetDays))) {
    if (day.items.some(i => i.id === habit.id)) continue;
    day.items.push({ id: habit.id, userId: data.userId, templateKey: habit.templateKey || habit.id,
      source: habit.templateKey ? 'default' : 'habit', category: habit.templateKey ? 'ibadah' : habit.category,
      title: habit.title, description: habit.description, priority: habit.priority, time: habit.time,
      completed: habit.templateKey === 'quran' && day.completedPages >= day.targetPages });
    changed = true;
  }
  for (const task of data.tasks.filter(t => scheduled(t, key, data.settings.hijriOffsetDays))) {
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
  if (key < currentDate) return day.items.filter(i => !PRAYERS.includes(i.templateKey));
  const times = prayerTimes(key, settings);
  const currentTime = new Intl.DateTimeFormat('en-GB', { timeZone: settings.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
  return day.items.filter(i => {
    if (PRAYERS.includes(i.templateKey)) return false;
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
    const day = data.days[key], eligible = eligibleItems(day, key, data.settings, now).filter(i => i.source !== 'custom');
    const done = eligible.filter(i => i.completed).length;
    total += eligible.length; completed += done; pages += day.completedPages;
    if (day.completedPages >= day.targetPages) targets++;
    return { date: key, total: eligible.length, completed: done, rate: eligible.length ? Math.round(done / eligible.length * 100) : null };
  });
  return { total, completed, rate: total ? Math.round(completed / total * 100) : null, pages, targets, trend,
    notes: Object.keys(data.notes).filter(key => key >= start && key <= end && data.notes[key].content).length };
}
