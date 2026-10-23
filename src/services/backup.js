import { DEFAULT_ITEMS, LEGACY_DEFAULT_ITEMS, THEMES, TASK_CATEGORIES, FINANCE_CATEGORIES, PRAYERS } from '../data/presets.js';
import { addDays } from './dates.js';
import { migrateProfile } from './migrations.js';
const fail = () => { throw new Error('INVALID_BACKUP'); };
const object = v => v && typeof v === 'object' && !Array.isArray(v);
const string = (v, max = 200) => typeof v === 'string' && v.length <= max;
const number = (v, min, max) => Number.isFinite(v) && v >= min && v <= max;
const integer = (v, min, max) => Number.isSafeInteger(v) && number(v, min, max);
const key = v => string(v) && /^[a-zA-Z0-9_:-]+$/.test(v) && !['__proto__', 'constructor', 'prototype'].includes(v);
const date = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && v >= '1900-01-01' && v <= '2200-12-31' && addDays(v, 0) === v;
const bool = v => typeof v === 'boolean';
const member = (v, choices) => choices.includes(v);
export function validateSettings(s) {
  if (!object(s) || !member(s.language, ['id', 'ar']) || !Object.hasOwn(THEMES, s.theme) || !member(s.colorMode, ['light', 'dark', 'system']) || !object(s.colors)) fail();
  for (const [name, value] of Object.entries(s.colors)) if (!member(name, ['primary', 'accent', 'background', 'surface']) || !/^#[0-9a-f]{6}$/i.test(value)) fail();
  if (!member(s.font, ['system', 'humanist', 'serif']) || !member(s.arabicFont, ['sans', 'serif']) || !integer(s.fontScale, 85, 140) || !member(s.lineHeight, [1.4, 1.5, 1.7]) || !member(s.density, ['comfortable', 'compact']) || !bool(s.reducedMotion)) fail();
  if (!integer(s.hijriOffsetDays, -2, 2) || !integer(s.quranTargetPages, 1, 1000) || !member(s.weekStartsOn, [0, 1]) || !string(s.displayName, 80) || !string(s.locationLabel, 100)) fail();
  if (!(s.latitude === null && s.longitude === null) && !(number(s.latitude, -90, 90) && number(s.longitude, -180, 180))) fail();
  if (!member(s.prayerMethod, ['Singapore', 'MuslimWorldLeague', 'Egyptian', 'Karachi', 'UmmAlQura', 'NorthAmerica']) || !member(s.asrMethod, ['Shafi', 'Hanafi']) || !object(s.prayerOffsetsMinutes)) fail();
  for (const p of PRAYERS) if (!integer(s.prayerOffsetsMinutes[p], -120, 120)) fail();
  for (const field of ['enableMondayFastReminder', 'enableThursdayFastReminder', 'enableAyyamulBidhReminder']) if (!bool(s[field])) fail();
  try { if (!string(s.timezone, 100)) fail(); new Intl.DateTimeFormat('en', { timeZone: s.timezone }).format(); } catch { fail(); }
  return s;
}
export function validateBackup(input) {
  if (!object(input) || !member(input.app, ['yawm', 'sakinah']) || !member(input.schemaVersion, [1, 2]) || !object(input.data)) fail();
  const d = input.data;
  if (d.schemaVersion !== input.schemaVersion || !key(d.userId) || !object(d.days) || !object(d.notes) || !object(d.fasting)) fail();
  validateSettings(d.settings);
  for (const field of ['tasks', 'transactions', 'recurringExpenses', ...(d.schemaVersion === 2 ? ['habits'] : [])]) {
    if (!Array.isArray(d[field]) || d[field].length > 20000 || new Set(d[field].map(r => r.id)).size !== d[field].length) fail();
    for (const row of d[field]) if (!object(row) || !key(row.id) || row.userId !== d.userId) fail();
  }
  if (d.schemaVersion === 2 && new Set([...d.tasks, ...d.habits].map(row => row.id)).size !== d.tasks.length + d.habits.length) fail();
  for (const [dayKey, day] of Object.entries(d.days)) {
    if (!date(dayKey) || !object(day) || day.date !== dayKey || day.userId !== d.userId || !integer(day.targetPages, 1, 1000) || !integer(day.completedPages, 0, 100000) || !Array.isArray(day.items) || day.items.length > 1000 || new Set(day.items.map(i => i.id)).size !== day.items.length) fail();
    if (d.schemaVersion === 1 && day.items.filter(i => i.source === 'default').length !== LEGACY_DEFAULT_ITEMS.length) fail();
    if (day.legacyPrayerItems !== undefined && (!Array.isArray(day.legacyPrayerItems) || day.legacyPrayerItems.length > 5 || day.legacyPrayerItems.some(i => !object(i) || i.userId !== d.userId || !PRAYERS.includes(i.templateKey) || !bool(i.completed)))) fail();
    for (const item of day.items) {
      if (!object(item) || !key(item.id) || item.userId !== d.userId || !bool(item.completed) || !member(item.source, ['default', 'custom', ...(d.schemaVersion === 2 ? ['habit'] : [])]) || !member(item.category, ['ibadah', ...TASK_CATEGORIES])) fail();
      if (item.source === 'default' && (!member(item.templateKey, d.schemaVersion === 1 ? LEGACY_DEFAULT_ITEMS : DEFAULT_ITEMS) || item.id !== `default:${item.templateKey}` || item.category !== 'ibadah')) fail();
      if (item.source !== 'default' && (!string(item.title) || !member(item.priority, ['normal', 'important']))) fail();
      if (item.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)) fail();
      if (item.description !== undefined && !string(item.description, 5000)) fail();
    }
  }
  for (const [k, n] of Object.entries(d.notes)) if (!date(k) || !object(n) || n.userId !== d.userId || !string(n.content, 5000)) fail();
  for (const [k, f] of Object.entries(d.fasting)) if (!date(k) || !object(f) || f.userId !== d.userId || !member(f.status, ['planned', 'completed', 'skipped', ''])) fail();
  for (const task of [...d.tasks, ...(d.habits || [])]) {
    const isDefault = d.schemaVersion === 2 && (d.habits || []).includes(task) && DEFAULT_ITEMS.includes(task.templateKey) && task.id === `default:${task.templateKey}`;
    if ((!isDefault && task.id.startsWith('default:')) || (task.reminder !== undefined && !bool(task.reminder))) fail();
    if (!string(task.title) || (!isDefault && !task.title.trim()) || !string(task.description, 5000) || !date(task.date) || !member(task.category, TASK_CATEGORIES) || !member(task.scheduleType, ['once', 'daily', 'weekly', 'monthly']) || !member(task.priority, ['normal', 'important']) || !bool(task.active) || !Array.isArray(task.weekdays) || !task.weekdays.every(n => integer(n, 0, 6)) || (task.scheduleType === 'weekly' && !task.weekdays.length)) fail();
    if (task.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(task.time)) fail();
    if (task.kind !== undefined && !member(task.kind, ['todo', 'event'])) fail();
    if (task.calendar !== undefined && !member(task.calendar, ['hijri', 'gregorian'])) fail();
    if (task.reminderMinutes !== undefined && !member(task.reminderMinutes, [0, 15, 30, 60, 1440])) fail();
  }
  for (const tx of d.transactions) if (!member(tx.type, ['income', 'expense']) || !integer(tx.amount, 1, 999999999999) || !date(tx.date) || !string(tx.title) || !tx.title.trim() || !string(tx.note, 5000) || !member(tx.categoryId, [...FINANCE_CATEGORIES, 'salary', 'business', 'gift']) || (tx.recurringExpenseId && (!key(tx.recurringExpenseId) || !date(tx.occurrenceDate)))) fail();
  const payments = d.transactions.filter(tx => tx.recurringExpenseId);
  if (payments.some(tx => tx.type !== 'expense') || new Set(payments.map(tx => `${tx.recurringExpenseId}:${tx.occurrenceDate}`)).size !== payments.length) fail();
  for (const r of d.recurringExpenses) if (!string(r.title) || !r.title.trim() || !integer(r.amount, 1, 999999999999) || !member(r.categoryId, FINANCE_CATEGORIES) || !date(r.startDate) || (r.endDate && (!date(r.endDate) || r.endDate < r.startDate)) || !member(r.frequency, ['weekly', 'monthly', 'yearly']) || !integer(r.dueDay, 1, 31) || !bool(r.active) || !string(r.note, 5000)) fail();
  // Reject prototype-pollution keys anywhere before merge, and limit payload size.
  const raw = JSON.stringify(input);
  if (raw.length > 5 * 1024 * 1024 || /"(?:__proto__|constructor|prototype)"\s*:/.test(raw)) fail();
  return migrateProfile(d);
}
export const makeBackup = data => ({ app: 'yawm', schemaVersion: data.schemaVersion, exportedAt: new Date().toISOString(), data });
export function restoreBackup(current, imported, mode) {
  const incoming = structuredClone(imported);
  incoming.userId = current.userId;
  for (const rows of [incoming.tasks, incoming.habits, incoming.transactions, incoming.recurringExpenses, Object.values(incoming.notes), Object.values(incoming.fasting), Object.values(incoming.days)]) for (const row of rows) row.userId = current.userId;
  for (const day of Object.values(incoming.days)) for (const item of day.items) item.userId = current.userId;
  for (const day of Object.values(incoming.days)) for (const item of day.legacyPrayerItems || []) item.userId = current.userId;
  if (mode === 'replace') return incoming;
  const combined = structuredClone(current);
  for (const field of ['tasks', 'habits', 'transactions', 'recurringExpenses']) combined[field] = [...new Map([...current[field], ...incoming[field]].map(r => [r.id, r])).values()];
  combined.transactions = [...new Map(combined.transactions.map(tx => [tx.recurringExpenseId ? `payment:${tx.recurringExpenseId}:${tx.occurrenceDate}` : `transaction:${tx.id}`, tx])).values()];
  for (const field of ['days', 'notes', 'fasting']) combined[field] = { ...current[field], ...incoming[field] };
  return combined;
}
