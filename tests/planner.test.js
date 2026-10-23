import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProfile } from '../src/db.js';
import { ensureDay, updateQuranProgress, updateQuranTarget, setItemCompletion, removePlannerTemplate, habitSummary } from '../src/services/routines.js';
import { financeSummary } from '../src/services/finance.js';
import { PRAYERS } from '../src/data/presets.js';
import { migrateProfile } from '../src/services/migrations.js';
import { makeBackup, validateBackup, restoreBackup } from '../src/services/backup.js';
import { addDays, hijri, hijriMonthRange, fromHijri, scheduled } from '../src/services/dates.js';
import { activitiesForDate, weekAgenda, upcomingActivities, dueReminders, zonedInstant } from '../src/services/agenda.js';

test('Quran target changes today and pre-opened future days without erasing progress or history', () => {
  const d = emptyProfile('personal');
  for (const key of ['2026-10-22', '2026-10-23', '2026-10-24']) ensureDay(d, key);
  updateQuranProgress(d, '2026-10-23', 3);
  updateQuranTarget(d, 5, '2026-10-23');
  assert.equal(d.days['2026-10-22'].targetPages, 2);
  assert.equal(d.days['2026-10-23'].targetPages, 5);
  assert.equal(d.days['2026-10-24'].targetPages, 5);
  assert.equal(d.days['2026-10-23'].completedPages, 3);
  assert.equal(d.days['2026-10-23'].items.find(i => i.templateKey === 'quran').completed, false);
  updateQuranProgress(d, '2026-10-23', 6, 5);
  assert.equal(d.days['2026-10-23'].items.find(i => i.templateKey === 'quran').completed, true);
  assert.throws(() => updateQuranProgress(d, '2026-10-23', -1));
  assert.throws(() => updateQuranTarget(d, 0, '2026-10-23'));
});
test('Quran completion and page progress remain in sync', () => {
  const d = emptyProfile('personal'); ensureDay(d, '2026-10-23');
  setItemCompletion(d, '2026-10-23', 'default:quran', true);
  assert.equal(d.days['2026-10-23'].completedPages, 2);
  setItemCompletion(d, '2026-10-23', 'default:quran', false);
  assert.equal(d.days['2026-10-23'].completedPages, 0);
});
test('legacy prayer history survives migration while compulsory prayers leave checklists', () => {
  const old = emptyProfile('personal'); ensureDay(old, '2026-10-23');
  old.schemaVersion = 1; delete old.habits;
  for (const templateKey of PRAYERS) old.days['2026-10-23'].items.push({ id: `default:${templateKey}`, userId: old.userId, templateKey, source: 'default', category: 'ibadah', completed: true });
  const migrated = validateBackup(makeBackup(old));
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.days['2026-10-23'].legacyPrayerItems.length, 5);
  assert.equal(migrated.days['2026-10-23'].items.length, 6);
  assert.ok(!migrated.habits.some(h => PRAYERS.includes(h.templateKey)));
  assert.deepEqual(migrateProfile(migrated), migrated);
  assert.doesNotThrow(() => validateBackup(makeBackup(migrated)));
});
test('Hijri input roundtrips at month/year boundaries and applies the configured offset', () => {
  for (const key of ['2026-10-23', '2026-10-12', '2026-11-10', '2027-06-06', '2024-02-29']) for (const offset of [-2, 0, 2]) {
    const h = hijri(key, offset);
    assert.equal(fromHijri(h.year, h.month, h.day, offset), key);
    const range = hijriMonthRange(key, offset);
    assert.equal(hijri(range.start, offset).day, 1);
    assert.ok([29, 30].includes(range.length));
    assert.equal(hijri(range.next, offset).day, 1);
  }
  assert.equal(fromHijri(1448, 13, 1), null);
  assert.equal(fromHijri(1448, 5, 31), null);
});
test('weekly markers, nearest activities and early reminders work without opening future days', () => {
  const d = emptyProfile('personal');
  d.tasks.push({ id: 'event', userId: d.userId, kind: 'event', title: 'Kajian', description: '', date: '2026-10-24', scheduleType: 'once', weekdays: [], active: true, time: '00:10', category: 'islami', priority: 'normal', reminder: true, reminderMinutes: 30 });
  const now = new Date('2026-10-23T16:50:00Z'); // Jakarta 23:50, reminder before midnight.
  assert.equal(activitiesForDate(d, '2026-10-24')[0].title, 'Kajian');
  assert.equal(weekAgenda(d, '2026-10-23').find(x => x.date === '2026-10-24').activities.length, 1);
  assert.equal(upcomingActivities(d, now)[0].occurrenceDate, '2026-10-24');
  assert.equal(dueReminders(d, now).length, 1);
  assert.equal(zonedInstant('2026-10-24', '00:10', 'Asia/Jakarta').toISOString(), '2026-10-23T17:10:00.000Z');
  ensureDay(d, '2026-10-24'); setItemCompletion(d, '2026-10-24', 'event', true);
  assert.equal(upcomingActivities(d, now).length, 0);
  assert.equal(dueReminders(d, now).length, 0);
});
test('to-do and habit completion stay independent; habit deletion preserves recorded history and finance', () => {
  const d = emptyProfile('personal');
  const base = { userId: d.userId, title: 'Salat sunah', description: '', category: 'islami', date: '2026-10-20', scheduleType: 'daily', weekdays: [], active: true, time: '', priority: 'normal' };
  d.habits.push({ ...base, id: 'habit-custom' }); d.tasks.push({ ...base, id: 'todo-custom', kind: 'todo' });
  d.transactions.push({ id: 'income', userId: d.userId, amount: 100, date: '2026-10-23', type: 'income', categoryId: 'salary', title: 'Income', note: '' });
  for (const key of ['2026-10-22', '2026-10-23', '2026-10-24']) ensureDay(d, key);
  setItemCompletion(d, '2026-10-23', 'todo-custom', true);
  assert.equal(d.days['2026-10-23'].items.find(i => i.id === 'habit-custom').completed, false);
  assert.equal(habitSummary(d, '2026-10-23', '2026-10-23', new Date('2026-10-23T16:00:00Z')).completed, 0);
  setItemCompletion(d, '2026-10-22', 'habit-custom', true);
  removePlannerTemplate(d, 'habit-custom', 'habits', '2026-10-23');
  ensureDay(d, '2026-10-24');
  assert.ok(!d.days['2026-10-24'].items.some(i => i.id === 'habit-custom'));
  assert.ok(d.days['2026-10-22'].items.find(i => i.id === 'habit-custom').completed);
  assert.equal(d.tasks.length, 1); assert.equal(d.transactions.length, 1);
  assert.doesNotThrow(() => validateBackup(makeBackup(d)));
  removePlannerTemplate(d, 'todo-custom', 'tasks', '2026-10-23');
  assert.equal(weekAgenda(d, '2026-10-23').reduce((n, x) => n + x.activities.length, 0), 0);
});
test('Hijri monthly scheduling clamps the last day and finance periods span Gregorian months', () => {
  let first = '2026-10-01';
  while (hijri(first).day !== 30) first = addDays(first, 1);
  let next = hijriMonthRange(first).next, range = hijriMonthRange(next);
  for (let i = 0; range.length !== 29 && i < 12; i++) { next = range.next; range = hijriMonthRange(next); }
  assert.equal(range.length, 29);
  const h = hijri(next);
  assert.equal(fromHijri(h.year, h.month, 30), null);
  const habit = { date: first, active: true, scheduleType: 'monthly', calendar: 'hijri' };
  assert.ok(scheduled(habit, range.end));
  assert.ok(!scheduled(habit, addDays(range.end, -1)));
  const d = emptyProfile('personal');
  for (const [i, date] of [range.start, range.end, addDays(range.end, 1)].entries()) d.transactions.push({ id: String(i), type: 'income', amount: 100, date });
  assert.equal(financeSummary(d, next.slice(0, 7), range.end, { calendarBounds: range }).income, 200);
});
test('backup preserves manual habits and per-day status when restoring to another profile', () => {
  const d = emptyProfile('personal'); ensureDay(d, '2026-10-23');
  setItemCompletion(d, '2026-10-23', 'default:duha', true);
  const backup = validateBackup(makeBackup(d));
  const restored = restoreBackup(emptyProfile('family'), backup, 'replace');
  assert.equal(restored.habits.length, 6);
  assert.ok(restored.habits.every(h => h.userId === 'family'));
  assert.ok(restored.days['2026-10-23'].items.find(i => i.id === 'default:duha').completed);
  assert.doesNotThrow(() => validateBackup(makeBackup(restored)));
});
