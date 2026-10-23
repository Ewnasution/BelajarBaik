import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS } from '../src/data/presets.js';
import { emptyProfile } from '../src/db.js';
import { dateKey, addDays, hijri, periodRange, scheduled, fastingTypes } from '../src/services/dates.js';
import { prayerTimes, nextPrayer } from '../src/services/prayers.js';
import { occurrences, financeSummary } from '../src/services/finance.js';
import { ensureDay, eligibleItems, habitSummary } from '../src/services/routines.js';
import { makeBackup, validateBackup, restoreBackup } from '../src/services/backup.js';
import { contrast, readable } from '../src/services/appearance.js';

test('date boundaries use the selected timezone, with leap days and Hijri offset', () => {
  const instant = new Date('2026-10-22T18:00:00Z');
  assert.equal(dateKey(instant, 'Asia/Jakarta'), '2026-10-23');
  assert.equal(dateKey(instant, 'America/New_York'), '2026-10-22');
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.deepEqual(hijri('2026-10-23', 1), hijri('2026-10-24', 0));
  assert.deepEqual(periodRange('2026-10-25', 'weekly'), { start: '2026-10-19', end: '2026-10-25' });
});
test('calendar fasting labels follow weekday and Hijri offset switches', () => {
  const settings = structuredClone(DEFAULT_SETTINGS);
  assert.ok(fastingTypes('2026-10-26', settings).includes('monday'));
  settings.enableMondayFastReminder = false;
  assert.ok(!fastingTypes('2026-10-26', settings).includes('monday'));
  const date = Array.from({ length: 30 }, (_, i) => addDays('2026-10-01', i)).find(k => hijri(k).day === 13);
  assert.ok(fastingTypes(date, settings).includes('ayyamul_bidh'));
  settings.hijriOffsetDays = -1;
  assert.ok(!fastingTypes(date, settings).includes('ayyamul_bidh'));
});
test('monthly tasks clamp 31 to the last day; repeat generation is idempotent', () => {
  const task = { id: 'task-1', userId: 'personal', title: 'Read', description: '', category: 'islami', date: '2026-01-31', scheduleType: 'monthly', weekdays: [], priority: 'normal', active: true, time: '' };
  assert.equal(scheduled(task, '2026-02-28'), true);
  assert.equal(scheduled(task, '2026-02-27'), false);
  const data = emptyProfile('personal'); data.tasks.push(task);
  assert.equal(ensureDay(data, '2026-02-28'), true);
  assert.equal(ensureDay(data, '2026-02-28'), false);
  assert.equal(data.days['2026-02-28'].items.length, 12);
  data.settings.quranTargetPages = 5;
  ensureDay(data, '2026-03-01');
  assert.equal(data.days['2026-02-28'].targetPages, 2);
  assert.equal(data.days['2026-03-01'].targetPages, 5);
});
test('prayer calculations are ordered, location-dependent, and honor offsets and midnight', () => {
  const settings = { ...structuredClone(DEFAULT_SETTINGS), latitude: -6.2088, longitude: 106.8456 };
  const prayers = prayerTimes('2026-10-23', settings);
  assert.equal(prayers.length, 5);
  assert.ok(prayers.every(p => Number.isFinite(p.time.getTime())));
  assert.ok(prayers.slice(1).every((p, i) => p.time > prayers[i].time));
  const original = prayers[0].time.getTime(); settings.prayerOffsetsMinutes.fajr = 5;
  assert.equal(prayerTimes('2026-10-23', settings)[0].time.getTime(), original + 300000);
  const upcoming = nextPrayer(settings, new Date('2026-10-23T16:30:00Z'));
  assert.equal(upcoming.name, 'fajr');
  assert.equal(dateKey(upcoming.time, settings.timezone), '2026-10-24');
  assert.deepEqual(prayerTimes('2026-10-23', DEFAULT_SETTINGS), []);
});
test('future tasks are excluded even if checked early; absent data is null', () => {
  const data = emptyProfile('personal'); ensureDay(data, '2026-10-24');
  const now = new Date('2026-10-23T03:00:00Z');
  assert.equal(eligibleItems(data.days['2026-10-24'], '2026-10-24', data.settings, now).length, 0);
  assert.equal(habitSummary(data, '2026-10-24', '2026-10-24', now).rate, null);
  data.days['2026-10-24'].items[0].completed = true;
  data.days['2026-10-24'].completedPages = 10;
  assert.equal(habitSummary(data, '2026-10-24', '2026-10-24', now).rate, null);
  assert.equal(habitSummary(data, '2026-10-24', '2026-10-24', now).pages, 0);
  ensureDay(data, '2026-10-23');
  data.days['2026-10-23'].items.push({ id: 'later', templateKey: 'later', time: '15:00', completed: true });
  assert.ok(!eligibleItems(data.days['2026-10-23'], '2026-10-23', data.settings, now).some(i => i.id === 'later'));
  assert.equal(habitSummary(data, '2026-09-01', '2026-09-30', now).rate, null);
});
const bill = { id: 'bill-1', userId: 'personal', title: 'Rent', amount: 1000000, categoryId: 'home', frequency: 'monthly', startDate: '2026-01-31', endDate: '', dueDay: 31, active: true, note: '' };
test('recurring expenses clamp short months, respect end dates, and repeat weekly/yearly', () => {
  assert.equal(occurrences(bill, '2026-02-01', '2026-02-28')[0].occurrenceDate, '2026-02-28');
  assert.equal(occurrences({ ...bill, endDate: '2026-02-27' }, '2026-02-01', '2026-02-28').length, 0);
  assert.equal(occurrences({ ...bill, frequency: 'weekly' }, '2026-02-01', '2026-02-28').length, 4);
  assert.equal(occurrences({ ...bill, frequency: 'yearly' }, '2027-01-01', '2027-12-31').length, 1);
});
test('actual payments are immutable snapshots and do not double-count the forecast', () => {
  const data = emptyProfile('personal'); data.recurringExpenses.push(structuredClone(bill));
  assert.equal(financeSummary(data, '2026-10', '2026-10-23').projection, 1000000);
  data.transactions.push({ id: 'tx-1', userId: data.userId, type: 'expense', amount: 1000000, date: '2026-10-23', title: 'Rent', note: '', categoryId: 'home', recurringExpenseId: 'bill-1', occurrenceDate: '2026-10-31' });
  assert.equal(financeSummary(data, '2026-10', '2026-10-23').projection, 1000000);
  data.recurringExpenses[0].amount = 1200000;
  const f = financeSummary(data, '2026-10', '2026-10-23');
  assert.equal(f.expense, 1000000); assert.equal(f.projection, 1000000); assert.equal(f.unpaid.length, 0);
  data.transactions.push({ id: 'future', type: 'expense', amount: 50000, date: '2026-10-30' });
  assert.equal(financeSummary(data, '2026-10', '2026-10-23').projection, 1000000);
});
test('backup roundtrip preserves local records and isolates profiles on merge/replace', () => {
  const source = emptyProfile('personal'); ensureDay(source, '2026-10-23'); source.recurringExpenses.push(bill);
  source.notes['2026-10-23'] = { userId: 'personal', content: '<script>example text</script>' };
  const validated = validateBackup(JSON.parse(JSON.stringify(makeBackup(source))));
  const target = emptyProfile('family');
  const restored = restoreBackup(target, validated, 'replace');
  assert.equal(restored.userId, 'family'); assert.equal(restored.days['2026-10-23'].items[0].userId, 'family');
  assert.equal(restored.recurringExpenses[0].userId, 'family'); assert.equal(restored.notes['2026-10-23'].userId, 'family');
  assert.doesNotThrow(() => validateBackup(makeBackup(restored)));
  assert.equal(restoreBackup(restored, validated, 'merge').recurringExpenses.length, 1);
});
test('backup rejects unsafe colors, malformed dates, negative money, duplicate IDs, and pollution', () => {
  const cases = [
    d => d.settings.colors.primary = 'url(https://example.com)',
    d => d.settings.font = 'evil-css',
    d => d.settings.timezone = 'Invalid/Timezone',
    d => d.settings.quranTargetPages = -1,
    d => d.recurringExpenses.push({ ...bill, amount: -100 }),
    d => d.recurringExpenses.push({ ...bill, startDate: '2026-02-31' }),
    d => d.recurringExpenses.push(bill, bill),
  ];
  for (const corrupt of cases) { const d = emptyProfile('personal'); corrupt(d); assert.throws(() => validateBackup(makeBackup(d))); }
  const polluted = JSON.parse(JSON.stringify(makeBackup(emptyProfile('personal'))));
  Object.defineProperty(polluted.data.notes, '__proto__', { value: {}, enumerable: true });
  assert.throws(() => validateBackup(polluted));
});
test('merge deduplicates payments with different IDs for the same bill occurrence', () => {
  const current = emptyProfile('personal'), incoming = emptyProfile('personal');
  const payment = { id: 'tx-a', userId: 'personal', type: 'expense', amount: 1000000, date: '2026-10-23', title: 'Rent', note: '', categoryId: 'home', recurringExpenseId: 'bill-1', occurrenceDate: '2026-10-31' };
  current.transactions.push(payment); incoming.transactions.push({ ...payment, id: 'tx-b' });
  const merged = restoreBackup(current, incoming, 'merge');
  assert.equal(merged.transactions.length, 1);
  assert.doesNotThrow(() => validateBackup(makeBackup(merged)));
});
test('date filtering changes the period balance but keeps the monthly forecast', () => {
  const data = emptyProfile('personal');
  data.transactions.push({ type: 'income', amount: 1000, date: '2026-10-02' }, { type: 'expense', amount: 300, date: '2026-10-20' });
  const summary = financeSummary(data, '2026-10', '2026-10-23', { start: '2026-10-15', end: '2026-10-31' });
  assert.equal(summary.balance, -300); assert.equal(summary.income, 0); assert.equal(summary.projection, 300);
});
test('automatic foreground keeps AA contrast through the full grayscale range', () => {
  for (let shade = 0; shade < 256; shade++) {
    const background = '#' + shade.toString(16).padStart(2, '0').repeat(3);
    assert.ok(contrast(background, readable(background)) >= 4.5, background);
  }
});
