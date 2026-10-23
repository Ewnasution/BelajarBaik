import { PRAYERS, createDefaultHabits } from '../data/presets.js';

// Version 2 separates habits from activities. Compulsory-prayer history remains
// in the backup but is no longer an interactive checklist or an analytics input.
export function migrateProfile(profile) {
  const d = structuredClone(profile);
  if (d.schemaVersion !== 1) return d;
  const recurring = d.tasks.filter(task => task.scheduleType !== 'once');
  const recurringIds = new Set(recurring.map(task => task.id));
  d.habits = [...createDefaultHabits(d.userId), ...recurring.map(task => ({ ...task, calendar: 'gregorian' }))];
  d.tasks = d.tasks.filter(task => !recurringIds.has(task.id)).map(task => ({ ...task, kind: 'todo' }));
  for (const day of Object.values(d.days)) {
    day.legacyPrayerItems = [...(day.legacyPrayerItems || []), ...day.items.filter(i => i.source === 'default' && PRAYERS.includes(i.templateKey))];
    day.items = day.items.filter(i => !(i.source === 'default' && PRAYERS.includes(i.templateKey)));
    for (const item of day.items) {
      if (recurringIds.has(item.id)) item.source = 'habit';
      if (item.templateKey === 'quran') item.completed = day.completedPages >= day.targetPages;
    }
  }
  d.schemaVersion = 2;
  return d;
}
