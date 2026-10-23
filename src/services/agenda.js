import { addDays, dateKey, scheduled, periodRange } from './dates.js';

export function activitiesForDate(data, key, kind) {
  return data.tasks.filter(task => (!kind || (task.kind || 'todo') === kind) && scheduled(task, key, data.settings.hijriOffsetDays)).map(task => ({
    ...task, occurrenceDate: key, completed: data.days[key]?.items.find(item => item.id === task.id)?.completed || false,
  })).sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99') || a.title.localeCompare(b.title));
}
export function weekAgenda(data, selected) {
  const { start } = periodRange(selected, 'weekly', data.settings.weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => { const date = addDays(start, i); return { date, activities: activitiesForDate(data, date) }; });
}
export function zonedInstant(key, time, timezone) {
  const [year, month, day] = key.split('-').map(Number), [hour, minute] = time.split(':').map(Number);
  const wanted = Date.UTC(year, month - 1, day, hour, minute);
  let instant = wanted;
  const format = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  for (let i = 0; i < 3; i++) {
    const parts = format.formatToParts(new Date(instant)), value = k => Number(parts.find(p => p.type === k).value);
    const local = Date.UTC(value('year'), value('month') - 1, value('day'), value('hour'), value('minute'));
    instant += wanted - local;
  }
  return new Date(instant);
}
export function upcomingActivities(data, now = new Date(), days = 30) {
  const start = dateKey(now, data.settings.timezone), entries = [];
  for (let i = 0; i <= days; i++) for (const task of activitiesForDate(data, addDays(start, i))) {
    if (task.completed) continue;
    const instant = zonedInstant(task.occurrenceDate, task.time || '23:59', data.settings.timezone);
    if (instant >= now) entries.push({ ...task, instant });
  }
  return entries.sort((a, b) => a.instant - b.instant);
}
export function dueReminders(data, now = new Date()) {
  const entries = upcomingActivities(data, new Date(now.getTime() - 60000), 2);
  const start = dateKey(now, data.settings.timezone);
  for (let i = 0; i < 3; i++) for (const habit of data.habits || []) {
    const key = addDays(start, i);
    if (!habit.reminder || !habit.time || !scheduled(habit, key, data.settings.hijriOffsetDays) || data.days[key]?.items.find(item => item.id === habit.id)?.completed) continue;
    entries.push({ ...habit, occurrenceDate: key, instant: zonedInstant(key, habit.time, data.settings.timezone) });
  }
  return entries.filter(task => task.reminder && task.time &&
    now >= new Date(task.instant.getTime() - (task.reminderMinutes || 0) * 60000) && now <= new Date(task.instant.getTime() + 60000));
}
