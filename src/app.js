import './styles/tokens.css';
import './styles/app.css';
import { USERS } from './data/users.js';
import { THEMES, DEFAULT_SETTINGS, TASK_CATEGORIES, FINANCE_CATEGORIES, PRAYERS, CITIES } from './data/presets.js';
import { translate, categoryLabel } from './i18n.js';
import { icon } from './icons.js';
import { openDB, loadProfile, saveProfile, emptyProfile } from './db.js';
import { dateKey, addDays, parseDate, weekday, hijri, gregorian, monthRange, periodRange, fastingTypes, scheduled } from './services/dates.js';
import { prayerTimes, nextPrayer, timeLabel, countdown } from './services/prayers.js';
import { ensureDay, eligibleItems, habitSummary } from './services/routines.js';
import { financeSummary } from './services/finance.js';
import { applyAppearance, contrast } from './services/appearance.js';
import { makeBackup, validateBackup, validateSettings, restoreBackup } from './services/backup.js';

const app = document.querySelector('#app'), modal = document.querySelector('#modal');
const readPreference = key => { try { return localStorage.getItem(key); } catch { return null; } };
const preference = (key, value) => { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* Session still works without remembered preferences. */ } };
const state = { data: null, screen: 'home', selected: dateKey(), month: dateKey().slice(0, 7), financeStart: '', financeEnd: '', period: 'weekly', category: 'all', status: 'all', priority: 'all', language: readPreference('yawm-language') || 'id', cache: 'caching' };
let mutationQueue = Promise.resolve(), busy = false, appearanceDraft, pendingImport, installPrompt, lastFocus, toastTimer;
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const s = () => state.data?.settings || { ...DEFAULT_SETTINGS, language: state.language };
const t = key => translate(s().language, key);
const today = () => dateKey(new Date(), s().timezone);
const money = amount => new Intl.NumberFormat(s().language === 'ar' ? 'ar-SA' : 'id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
const num = n => new Intl.NumberFormat(s().language === 'ar' ? 'ar-SA' : 'id-ID').format(n);
const act = (action, label, symbol = '', cls = 'button secondary', extra = '') => `<button type="button" class="${cls}" data-action="${action}" aria-label="${e(label)}" ${extra}>${symbol ? icon(symbol) : ''}<span${cls.includes('icon-button') ? ' class="sr-only"' : ''}>${e(label)}</span></button>`;
const opts = (values, current, label = v => t(v)) => values.map(v => `<option value="${e(v)}" ${v === current ? 'selected' : ''}>${e(label(v))}</option>`).join('');
const field = (label, input, cls = '') => `<label class="field ${cls}"><span>${e(label)}</span>${input}</label>`;
const input = (name, value = '', attrs = '') => `<input name="${name}" value="${e(value)}" ${attrs}>`;
const select = (name, values, current, label) => `<select name="${name}">${opts(values, current, label)}</select>`;
const hint = text => `<p class="hint">${e(text)}</p>`;
const empty = (title, description = '', action = '') => `<div class="empty"><div class="empty-icon">${icon('leaf')}</div><p>${e(title)}</p>${description ? hint(description) : ''}${action}</div>`;
const sectionHeader = (title, subtitle = '', action = '') => `<div class="section-heading"><div><h2>${e(title)}</h2>${subtitle ? `<p>${e(subtitle)}</p>` : ''}</div>${action}</div>`;
function toast(text, error = false) {
  const el = document.querySelector('#toast'); clearTimeout(toastTimer); el.textContent = text; el.className = `visible ${error ? 'error' : ''}`;
  toastTimer = setTimeout(() => el.className = '', 4000);
}
function showDialog(title, content, formId = '') {
  lastFocus = document.activeElement;
  modal.innerHTML = `<div class="dialog-heading"><h2 id="dialog-title">${e(title)}</h2>${act('close', t('close'), 'close', 'icon-button')}</div>${formId ? `<form id="${formId}">${content}<p class="form-error" role="alert"></p></form>` : content}`;
  if (!modal.open) modal.showModal();
  requestAnimationFrame(() => (modal.querySelector('input:not([type=hidden]), textarea, select') || modal.querySelector('button'))?.focus());
}
function closeDialog() { modal.close(); if (appearanceDraft) { applyAppearance(s()); appearanceDraft = null; } lastFocus?.focus(); }
const formActions = () => `<div class="form-actions">${act('close', t('cancel'))}<button class="button primary" type="submit">${icon('check')}${e(t('save'))}</button></div>`;
function mutate(update, message = true) {
  mutationQueue = mutationQueue.then(async () => {
    const next = structuredClone(state.data);
    const replacement = await update(next);
    const result = replacement || next;
    validateBackup(makeBackup(result));
    await saveProfile(result);
    state.data = result;
    applyAppearance(s());
    render();
    if (message) toast(message === true ? t('saved') : message);
    return true;
  }).catch(error => { console.error(error); toast(t('storageError'), true); return false; });
  return mutationQueue;
}
async function navigate(screen, key) {
  if (busy) return;
  await mutationQueue;
  const selected = key || state.selected;
  if (['home', 'routines'].includes(screen)) {
    const next = structuredClone(state.data);
    if (ensureDay(next, selected)) {
      try { await saveProfile(next); state.data = next; }
      catch { toast(t('storageError'), true); return; }
    }
  }
  state.selected = selected;
  state.screen = screen;
  render(); window.scrollTo({ top: 0, behavior: 'instant' });
}
function render() {
  if (!state.data) return renderLogin();
  const focused = document.activeElement;
  const focusSelector = focused?.dataset.item ? `[data-item="${CSS.escape(focused.dataset.item)}"]` : focused?.dataset.control ? `[data-control="${CSS.escape(focused.dataset.control)}"]` : null;
  const profile = USERS.find(u => u.id === state.data.userId), name = s().displayName || t(profile.id === 'family' ? 'family' : 'personal');
  const connection = navigator.onLine ? 'online' : 'offline';
  app.innerHTML = `<a href="#main" class="skip-link">${e(t('skipContent'))}</a>
    <header class="topbar"><div class="topbar-inner"><a href="#home" class="brand" data-nav="home"><span class="brand-icon">${icon('leaf')}</span><span>Yawm<small>MUSLIM DAILY PLANNER</small></span></a>
    <div class="header-end"><span class="connection ${connection}"><i></i>${e(t(connection))}</span><span class="header-divider"></span><button class="profile-button" data-nav="settings" aria-label="${e(t('profile'))}"><span class="avatar">${e(name[0]?.toUpperCase())}</span><span class="profile-name">${e(name)}</span>${icon('chevron')}</button></div></div></header>
    <main id="main" class="container" tabindex="-1">${({ home: renderHome, routines: renderRoutines, finance: renderFinance, analytics: renderAnalytics, settings: renderSettings })[state.screen]()}</main>
    <nav class="bottom-nav" aria-label="${e(t('mainNavigation'))}">${['home', 'routines', 'finance', 'analytics', 'settings'].map(page => `<button data-nav="${page}" class="nav-item ${page === state.screen ? 'active' : ''}" ${page === state.screen ? 'aria-current="page"' : ''}>${icon(page)}<span>${e(t(page))}</span>${page === state.screen ? '<i></i>' : ''}</button>`).join('')}</nav>`;
  updateClock();
  if (focusSelector && !modal.open) document.querySelector(focusSelector)?.focus({ preventScroll: true });
}
function renderLogin() {
  applyAppearance(s());
  app.innerHTML = `<main class="login-layout"><section class="login-story"><a class="brand"><span class="brand-icon">${icon('leaf')}</span><span>Yawm<small>MUSLIM DAILY PLANNER</small></span></a>
    <div class="story-content"><span class="eyebrow">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span><h1>${e(t('tagline'))}</h1><p>${e(t('intro'))}</p><div class="story-lines"><span>${icon('sun')}${e(t('routines'))}</span><span>${icon('book')}${e(t('quranTarget'))}</span><span>${icon('finance')}${e(t('finance'))}</span></div></div>
    <div class="story-foot">${icon('shield')}<span>${e(t('private'))} · ${e(t('offlineReady'))}</span></div><div class="story-ornament" aria-hidden="true"></div></section>
    <section class="login-panel"><button class="language-switch" data-action="login-language">${state.language === 'ar' ? 'Indonesia' : 'العربية'}</button><div class="login-form"><span class="small-mark">${icon('leaf')}</span><p class="eyebrow">${e(t('welcome'))}</p><h2>${e(t('greeting'))}</h2><p class="muted">${e(t('chooseProfile'))}</p><form id="login-form"><div class="profile-options">${USERS.filter(u => u.enabled).map((u, i) => `<label class="profile-option"><input type="radio" name="userId" value="${u.id}" ${i === 0 ? 'checked' : ''}><span class="avatar">${icon(u.id === 'family' ? 'home' : 'leaf')}</span><span>${e(t(u.id === 'family' ? 'family' : 'personal'))}</span><span class="radio-dot"></span></label>`).join('')}</div><button class="button primary full" type="submit">${e(t('login'))}${icon('arrow')}</button><p class="form-error" role="alert"></p></form><p class="local-notice">${icon('shield')}${e(t('localNotice'))}</p></div><small class="login-version">Yawm · 1.0</small></section></main>`;
}
function dateControl() {
  return `<div class="date-control">${act('date-prev', t('back'), 'chevron', 'icon-button previous')}<label><span class="sr-only">${e(t('date'))}</span><input type="date" data-control="date" value="${state.selected}" min="1900-01-01" max="2200-12-31"></label>${act('date-next', t('next'), 'chevron', 'icon-button')}${act('date-today', t('today'), '', 'button text')}</div>`;
}
function pageIntro(title, subtitle, action = '') {
  return `<div class="page-intro"><div><p class="eyebrow">YAWM / ${e(t('dailySpace'))}</p><h1>${e(title)}</h1><p class="intro-subtitle">${e(subtitle)}</p></div>${action}</div>`;
}
function taskRows(items, day = state.data.days[state.selected]) {
  const times = prayerTimes(state.selected, s());
  return items.map(item => {
    const title = item.source === 'default' ? t(item.templateKey) : item.title;
    const time = times.find(p => p.name === item.templateKey);
    return `<div class="task-row ${item.completed ? 'is-complete' : ''}"><label class="task-check"><input type="checkbox" data-item="${e(item.id)}" ${item.completed ? 'checked' : ''}><span class="check-visual">${icon('check')}</span><span class="task-copy"><span class="task-title">${e(title)}${item.priority === 'important' ? `<span class="priority-marker" title="${e(t('important'))}">✦</span>` : ''}</span><span class="task-meta">${item.templateKey === 'quran' ? `${num(day.completedPages)} / ${num(day.targetPages)} ${e(t('pages'))}` : e(item.source === 'default' ? t(item.completed ? 'completed' : 'ibadah') : t(item.category))}</span></span></label><div class="task-right">${time ? `<span class="task-time">${timeLabel(time.time, s())}</span>` : item.time ? `<span class="task-time" dir="ltr">${e(item.time)}</span>` : ''}${item.source === 'custom' ? act('edit-task', t('editTask'), 'dots', 'icon-button', `data-id="${e(item.id)}"`) : ''}</div></div>`;
  }).join('');
}
function renderHome() {
  const day = state.data.days[state.selected], done = day.items.filter(i => i.completed).length;
  const rate = Math.round(done / day.items.length * 100), date = hijri(state.selected, s().hijriOffsetDays, s().language);
  const finance = financeSummary(state.data, today().slice(0, 7), today());
  const profile = USERS.find(u => u.id === state.data.userId), name = s().displayName || t(profile.id === 'family' ? 'family' : 'personal');
  const quranRate = Math.round(day.completedPages / day.targetPages * 100);
  let nextFast;
  for (let i = 0; i < 32; i++) { const key = addDays(state.selected, i); if (fastingTypes(key, s()).length) { nextFast = key; break; } }
  return `${pageIntro(`${t('welcome')}, ${name}.`, t('greeting'), act('add-task', t('addTask'), 'plus', 'button primary'))}
    <section class="day-banner"><div><span class="date-eyebrow">${e(state.selected === today() ? t('today') : t('date'))}<span class="tiny-diamond">✦</span> ${e(gregorian(state.selected, s().language, { weekday: 'long', day: undefined, month: undefined, year: undefined }))}</span><h2 class="hijri-date">${e(date.label)}</h2><p>${e(gregorian(state.selected, s().language))}</p></div><div class="banner-end">${act('calendar', t('calendar'), 'calendar', 'button secondary')}<span class="calendar-caption">${e(t('estimated'))}</span></div></section>
    <div class="home-grid"><div class="home-main"><section class="card worship-card">${sectionHeader(t('worship'), t('worshipSmall'), `<button class="text-link" data-nav="routines">${e(t('viewAll'))}${icon('arrow')}</button>`)}<div class="daily-progress"><span><strong>${num(done)}</strong> ${e(t('of'))} ${num(day.items.length)} ${e(t('routineDone'))}</span><strong>${num(rate)}%</strong></div><div class="progress-track"><span style="width:${rate}%"></span></div><div class="task-list">${taskRows(day.items.filter(i => PRAYERS.includes(i.templateKey) || ['morning', 'evening'].includes(i.templateKey)))}</div><button class="all-routines" data-nav="routines">${icon('routines')}${e(t('routines'))}<span>${num(day.items.length)} ${icon('arrow')}</span></button></section>
    <section class="card reflection-card"><div class="note-icon">${icon('note')}</div><div><span class="eyebrow">${e(t('note'))}</span><h2>${e(t('reflection'))}</h2><p>${e(t('reflectionHelp'))}</p></div>${act('note', t(state.data.notes[state.selected]?.content ? 'editNote' : 'writeNote'), 'edit', 'button secondary')}</section></div>
    <aside class="home-aside"><section class="prayer-card">${renderPrayerCard()}</section>
    <section class="card quran-card"><div class="card-icon">${icon('book')}</div><div><h2>${e(t('quranTarget'))}</h2><p>${e(t('quranSubtitle'))}</p></div><div class="quran-progress"><strong>${num(day.completedPages)}<small> / ${num(day.targetPages)}</small></strong><span>${e(t('pages'))} <b>${num(quranRate)}%</b></span></div><div class="progress-track"><span style="width:${Math.min(quranRate, 100)}%"></span></div><div class="quran-actions">${act('quran-plus', t('addPage'), '', 'button primary')}${act('quran-edit', t('editProgress'), 'edit', 'icon-button')}</div></section>
    ${nextFast ? `<section class="fasting-card"><div class="fasting-symbol">${icon('moon')}</div><div><span class="eyebrow">${e(t('fasting'))}</span><h3>${e(fastingTypes(nextFast, s()).map(t).join(' · '))}</h3><p>${e(gregorian(nextFast, s().language, { year: undefined }))}</p><button class="text-link" data-action="calendar">${e(t('fastingCalendar'))}${icon('arrow')}</button></div></section>` : ''}</aside></div>
    <section class="card finance-preview">${sectionHeader(t('financeMonth'), gregorian(today(), s().language, { weekday: undefined, day: undefined }), `<button class="text-link" data-nav="finance">${e(t('viewAll'))}${icon('arrow')}</button>`)}<div class="finance-preview-grid"><div><span>${e(t('balance'))}</span><strong>${money(finance.balance)}</strong></div><div><span>${icon('up')}${e(t('income'))}</span><strong>${money(finance.income)}</strong></div><div><span>${icon('down')}${e(t('expense'))}</span><strong>${money(finance.expense)}</strong></div></div>${!finance.transactions.length ? hint(t('noTransactions')) : ''}</section><p class="closing-thought">${icon('leaf')}${e(t('quiet'))}</p>`;
}
function renderPrayerCard() {
  const times = prayerTimes(today(), s());
  if (!times.length) return `<span class="prayer-icon">${icon('sun')}</span><span class="eyebrow">${e(t('prayerSchedule'))}</span><h2>${e(t('locationEmpty'))}</h2><p>${e(t('locationHelp'))}</p>${act('location', t('setLocation'), 'pin', 'button on-green')}`;
  const next = nextPrayer(s());
  return `<div class="prayer-top"><span class="eyebrow">${e(t('nextPrayer'))}</span>${icon('sun')}</div><div class="prayer-main"><h2 id="next-name">${e(next ? t(next.name) : '—')}</h2><strong id="next-time">${next ? timeLabel(next.time, s()) : '—'}</strong></div><div class="prayer-countdown"><span>${e(t('inTime'))}</span><span id="countdown" dir="ltr">${next ? countdown(next.time) : '—'}</span></div><div class="prayer-mini">${times.map(p => `<div data-prayer="${p.name}" class="${next?.name === p.name ? 'current' : ''}"><span>${e(t(p.name))}</span><strong>${timeLabel(p.time, s())}</strong></div>`).join('')}</div><button class="location-link" data-action="location">${icon('pin')}${e(s().locationLabel)} · ${e(s().prayerMethod)}${icon('chevron')}</button><small class="prayer-disclaimer">${e(t('calculationNotice'))}</small>`;
}
function renderRoutines() {
  const day = state.data.days[state.selected];
  const items = day.items.filter(i => (state.category === 'all' || state.category === i.category) && (state.status === 'all' || (state.status === 'completed') === i.completed) && (state.priority === 'all' || (i.priority || 'normal') === state.priority));
  const defaults = items.filter(i => i.source === 'default'), custom = items.filter(i => i.source === 'custom');
  const done = day.items.filter(i => i.completed).length;
  return `${pageIntro(t('routines'), t('worshipSmall'), act('add-task', t('addTask'), 'plus', 'button primary'))}${dateControl()}
    <div class="filter-bar">${field(t('category'), `<select data-control="category">${opts(['all', 'ibadah', ...TASK_CATEGORIES], state.category)}</select>`)}${field(t('status'), `<select data-control="status">${opts(['all', 'pending', 'completed'], state.status)}</select>`)}${field(t('priority'), `<select data-control="priority">${opts(['all', 'normal', 'important'], state.priority)}</select>`)}</div>
    <div class="routine-summary"><div class="progress-ring" style="--progress:${Math.round(done / day.items.length * 100)}%"><strong>${num(done)}</strong></div><div><h2>${num(done)} ${e(t('of'))} ${num(day.items.length)} ${e(t('completed'))}</h2><p>${e(hijri(state.selected, s().hijriOffsetDays, s().language).label)}</p></div></div>
    <div class="two-columns"><section class="card">${sectionHeader(t('ibadah'))}${defaults.length ? taskRows(defaults) : empty(t('taskEmpty'))}</section><section class="card">${sectionHeader(t('manageTasks'), '', act('add-task', t('addTask'), 'plus', 'icon-button'))}${custom.length ? taskRows(custom) : empty(t('taskEmpty'), t('taskEmptyHelp'), act('add-task', t('addTask'), 'plus'))}</section></div>
    <div class="secondary-actions">${act('manage-tasks', t('manageTasks'), 'routines')}${act('quran-edit', t('editProgress'), 'book')}${act('note', t('note'), 'note')}${act('calendar', t('calendar'), 'calendar')}</div>`;
}
function renderFinance() {
  const f = financeSummary(state.data, state.month, today(), { start: state.financeStart, end: state.financeEnd });
  const { start, end } = monthRange(state.month);
  return `${pageIntro(t('finance'), t('financeIntro'), act('transaction', t('addTransaction'), 'plus', 'button primary'))}<div class="filter-bar">${field(t('period'), `<input type="month" data-control="month" value="${state.month}" min="1900-01" max="2200-12">`)}${field(t('fromDate'), `<input type="date" data-control="financeStart" value="${state.financeStart || start}" min="${start}" max="${state.financeEnd || end}">`)}${field(t('toDate'), `<input type="date" data-control="financeEnd" value="${state.financeEnd || end}" min="${state.financeStart || start}" max="${end}">`)}</div>
    <div class="stat-grid"><div class="stat-card balance-card"><span>${e(t('balance'))}</span><strong>${money(f.balance)}</strong><small>${e(state.month)}</small></div><div class="stat-card card"><span>${icon('up')}${e(t('income'))}</span><strong>${money(f.income)}</strong></div><div class="stat-card card"><span>${icon('down')}${e(t('expense'))}</span><strong>${money(f.expense)}</strong></div></div>
    <div class="two-columns finance-columns"><section class="card">${sectionHeader(t('transactions'), '', act('transaction', t('addTransaction'), 'plus', 'icon-button'))}${f.transactions.length ? `<div class="transaction-list">${f.transactions.toSorted((a, b) => b.date.localeCompare(a.date)).map(tx => `<div class="transaction-row"><span class="transaction-icon ${tx.type}">${icon(tx.type === 'income' ? 'up' : 'down')}</span><div class="transaction-copy"><strong>${e(tx.title)}</strong><span>${e(t(categoryLabel(tx.categoryId)))} · ${e(gregorian(tx.date, s().language, { weekday: undefined, year: undefined }))}</span></div><strong class="transaction-amount ${tx.type}">${tx.type === 'income' ? '+' : '−'}${money(tx.amount)}</strong>${act('edit-transaction', t('editTransaction'), 'dots', 'icon-button', `data-id="${e(tx.id)}"`)}</div>`).join('')}</div>` : empty(t('noTransactions'), '', act('transaction', t('addTransaction'), 'plus'))}</section>
    <div class="stack"><section class="card projection-card"><span class="eyebrow">${e(t('projection'))}</span><strong class="big-amount">${money(f.projection)}</strong>${hint(t('projectionHelp'))}${!f.transactions.length ? `<span class="badge">${e(t('limitedData'))}</span>` : ''}</section><section class="card">${sectionHeader(t('recurring'), '', act('recurring', t('addRecurring'), 'plus', 'icon-button'))}${f.allOccurrences.length ? f.allOccurrences.map(r => { const paid = !f.unpaid.some(u => u.occurrenceId === r.occurrenceId); return `<div class="bill-row"><div><strong>${e(r.title)}</strong><span>${e(r.occurrenceDate)} · ${money(r.amount)}</span></div>${paid ? `<span class="badge">${icon('check')}${e(t('paid'))}</span>` : act('pay-bill', t('markPaid'), 'check', 'icon-button', `data-id="${e(r.id)}" data-date="${r.occurrenceDate}"`)}</div>`; }).join('') : hint(t('noBills'))}${act('manage-bills', t('recurringTemplates'), '', 'button text full')}</section></div></div>`;
}
function expenseBars(transactions) {
  const totals = {};
  for (const tx of transactions.filter(t => t.type === 'expense')) totals[tx.categoryId] = (totals[tx.categoryId] || 0) + tx.amount;
  const max = Math.max(...Object.values(totals), 1);
  return Object.entries(totals).toSorted((a, b) => b[1] - a[1]).map(([category, amount]) => `<div class="category-bar"><div><span>${e(t(categoryLabel(category)))}</span><strong>${money(amount)}</strong></div><div class="progress-track"><span style="width:${Math.round(amount / max * 100)}%"></span></div></div>`).join('') || empty(t('noData'));
}
function renderAnalytics() {
  const { start, end } = periodRange(state.selected, state.period, s().weekStartsOn);
  const h = habitSummary(state.data, start, end);
  const txs = state.data.transactions.filter(tx => tx.date >= start && tx.date <= end);
  const income = txs.filter(tx => tx.type === 'income').reduce((n, tx) => n + tx.amount, 0), expense = txs.filter(tx => tx.type === 'expense').reduce((n, tx) => n + tx.amount, 0);
  const previous = addDays(`${state.selected.slice(0, 7)}-01`, -1).slice(0, 7), prev = financeSummary(state.data, previous, today());
  const consistency = {};
  for (const key of Object.keys(state.data.days).filter(k => k >= start && k <= end && k <= today())) for (const item of eligibleItems(state.data.days[key], key, s())) {
    const c = consistency[item.templateKey] ||= { label: item.source === 'default' ? t(item.templateKey) : item.title, total: 0, done: 0 }; c.total++; c.done += Number(item.completed);
  }
  return `${pageIntro(t('analytics'), t('analyticsIntro'))}<div class="analytics-controls"><div class="segmented">${['daily', 'weekly', 'monthly'].map(p => `<button data-period="${p}" class="${state.period === p ? 'selected' : ''}">${e(t(p))}</button>`).join('')}</div>${dateControl()}</div><p class="period-label">${e(start)} — ${e(end)} ${end >= today() ? `<span class="badge">${e(t('ongoing'))}</span>` : ''}</p>
    <div class="stat-grid four"><div class="card stat-card"><span>${e(t('completion'))}</span><strong>${h.rate === null ? '—' : `${num(h.rate)}%`}</strong><small>${h.total ? `${num(h.completed)} / ${num(h.total)}` : e(t('noData'))}</small></div><div class="card stat-card"><span>${e(t('quranPages'))}</span><strong>${num(h.pages)}</strong><small>${e(t('pages'))}</small></div><div class="card stat-card"><span>${e(t('targetDays'))}</span><strong>${num(h.targets)}</strong></div><div class="card stat-card"><span>${e(t('reflectionDays'))}</span><strong>${num(h.notes)}</strong></div></div>
    <div class="two-columns"><section class="card">${sectionHeader(t('habitTrends'))}${hint(t('eligibleHelp'))}<div class="trend-chart">${Array.from({ length: Math.round((parseDate(end) - parseDate(start)) / 86400000) + 1 }, (_, i) => { const key = addDays(start, i), entry = h.trend.find(x => x.date === key); return `<div class="trend-column"><span class="trend-value">${entry?.rate != null ? num(entry.rate) + '%' : '—'}</span><div class="trend-track"><div style="height:${entry?.rate ?? 0}%"></div></div><span>${num(Number(key.slice(8)))}</span><span class="sr-only">${key}: ${entry?.rate != null ? entry.rate + '%' : e(t('noData'))}</span></div>`; }).join('')}</div></section><section class="card">${sectionHeader(t('consistent'))}${Object.values(consistency).filter(c => c.done).toSorted((a, b) => b.done / b.total - a.done / a.total).slice(0, 5).map(c => `<div class="consistency-row"><span>${e(c.label)}</span><strong>${num(c.done)} / ${num(c.total)}</strong></div>`).join('') || empty(t('noData'))}</section></div>
    <div class="two-columns"><section class="card">${sectionHeader(t('expenseCategories'))}${expenseBars(txs)}</section><section class="card">${sectionHeader(t('finance'))}<dl class="summary-list"><div><dt>${e(t('income'))}</dt><dd>${money(income)}</dd></div><div><dt>${e(t('expense'))}</dt><dd>${money(expense)}</dd></div><div><dt>${e(t('balance'))}</dt><dd>${money(income - expense)}</dd></div><div><dt>${e(t('previousMonth'))}</dt><dd>${prev.transactions.length ? money(prev.expense) : e(t('noData'))}</dd></div><div><dt>${e(t('projection'))}</dt><dd>${money(financeSummary(state.data, state.selected.slice(0, 7), today()).projection)}</dd></div></dl>${hint(t('projectionHelp'))}</section></div>`;
}
function settingRow(symbol, title, detail, action) {
  return `<button class="setting-row" data-action="${action}"><span class="setting-icon">${icon(symbol)}</span><span><strong>${e(title)}</strong><small>${e(detail)}</small></span>${icon('chevron')}</button>`;
}
function renderSettings() {
  return `${pageIntro(t('settings'), t('settingsIntro'))}<div class="settings-grid"><section class="card setting-section">${sectionHeader(t('appearance'))}<div class="theme-current"><span class="mini-theme" data-preview-theme="${s().theme}"><i></i><i></i><i></i></span><div><h3>${e(t(s().theme))}</h3><p>${e(t(s().colorMode))} · ${num(s().fontScale)}%</p></div></div>${act('appearance', t('appearance'), 'sparkle', 'button primary full')}${settingRow('leaf', t('language'), s().language === 'ar' ? 'العربية' : 'Indonesia', 'language')}</section>
    <section class="card setting-section">${sectionHeader(t('routines'))}${settingRow('pin', t('location'), s().locationLabel || t('setLocation'), 'location')}${settingRow('calendar', t('calendarSettings'), `${t('target')}: ${num(s().quranTargetPages)} ${t('pages')}`, 'calendar-settings')}${settingRow('moon', t('reminders'), t('remindersHelp'), 'reminders')}</section>
    <section class="card setting-section">${sectionHeader(t('dataBackup'))}${hint(t('backupHelp'))}<div class="backup-buttons">${act('export', t('export'), 'download')}${act('import', t('import'), 'upload')}</div><input type="file" id="backup-file" accept="application/json,.json" hidden><div class="offline-status">${icon('shield')}<div><strong>${e(t(state.cache))}</strong><small>${e(t('private'))}</small></div></div>${act('delete-data', t('deleteData'), 'trash', 'button danger-text')}</section>
    <section class="card setting-section">${sectionHeader(t('profile'))}${settingRow('leaf', t('displayName'), s().displayName || t(state.data.userId === 'family' ? 'family' : 'personal'), 'profile')}${settingRow('logout', t('logout'), t('localNotice'), 'logout')}${act('install', t('install'), 'download', 'button secondary full')}</section></div><section class="about-panel">${icon('leaf')}<h2>${e(t('about'))}</h2><p>${e(t('aboutText'))}</p></section>`;
}

function taskForm(id) {
  const task = state.data.tasks.find(x => x.id === id);
  if (id && !task) {
    const snapshot = state.data.days[state.selected]?.items.find(i => i.id === id);
    if (snapshot) showDialog(snapshot.title, `<p>${e(snapshot.description || '')}</p>${hint(t('archived'))}`);
    return;
  }
  const value = task || { title: '', description: '', category: 'islami', date: state.selected, scheduleType: 'once', time: '', priority: 'normal', weekdays: [weekday(state.selected)] };
  showDialog(t(task ? 'editTask' : 'addTask'), `${input('id', task?.id || '', 'type="hidden"')}${field(t('taskTitle'), input('title', value.title, 'required maxlength="200" autocomplete="off"'))}
    <div class="form-grid">${field(t('category'), select('category', TASK_CATEGORIES, value.category))}${field(t('priority'), select('priority', ['normal', 'important'], value.priority))}${field(t('startDate'), input('date', value.date, 'type="date" required min="1900-01-01" max="2200-12-31"'))}${field(t('time'), input('time', value.time, 'type="time"'))}</div>
    ${field(t('repeat'), select('scheduleType', ['once', 'daily', 'weekly', 'monthly'], value.scheduleType))}<fieldset class="weekday-field"><legend>${e(t('weekdays'))}</legend><div class="weekday-options">${Array.from({ length: 7 }, (_, i) => `<label><input type="checkbox" name="weekdays" value="${i}" ${value.weekdays.includes(i) ? 'checked' : ''}><span>${e(gregorian(addDays('2026-10-18', i), s().language, { weekday: 'short', day: undefined, month: undefined, year: undefined }))}</span></label>`).join('')}</div></fieldset>
    <label class="switch-row"><span>${e(t('taskReminder'))}</span><input type="checkbox" name="reminder" ${value.reminder ? 'checked' : ''}></label>${hint(t('remindersHelp'))}${field(t('description'), `<textarea name="description" maxlength="5000" rows="3">${e(value.description)}</textarea>`)}${task ? `<div class="secondary-actions">${act(task.active ? 'archive-task' : 'restore-task', t(task.active ? 'archive' : 'restore'), '', 'button secondary', `data-id="${task.id}"`)}${act('delete-task', t('delete'), 'trash', 'button danger-text', `data-id="${task.id}"`)}</div>` : ''}${formActions()}`, 'task-form');
}
function transactionForm(id, bill, occurrenceDate) {
  const tx = state.data.transactions.find(x => x.id === id);
  const value = tx || { type: bill ? 'expense' : 'expense', title: bill?.title || '', amount: bill?.amount || '', categoryId: bill?.categoryId || 'daily', date: today(), note: '' };
  showDialog(t(tx ? 'editTransaction' : 'addTransaction'), `${input('id', id || '', 'type="hidden"')}${input('recurringExpenseId', tx?.recurringExpenseId || bill?.id || '', 'type="hidden"')}${input('occurrenceDate', tx?.occurrenceDate || occurrenceDate || '', 'type="hidden"')}
    ${field(t('type'), select('type', ['income', 'expense'], value.type))}${field(t('transactionTitle'), input('title', value.title, 'required maxlength="200"'))}<div class="form-grid">${field(t('amount'), input('amount', value.amount, 'type="number" inputmode="numeric" min="1" max="999999999999" step="1" required dir="ltr"'))}${field(t('date'), input('date', value.date, 'type="date" required min="1900-01-01" max="2200-12-31"'))}</div>
    ${field(t('category'), select('categoryId', [...FINANCE_CATEGORIES, 'salary', 'business', 'gift'], value.categoryId, value => t(categoryLabel(value))))}${field(t('note'), `<textarea name="note" maxlength="5000" rows="3">${e(value.note)}</textarea>`)}${tx ? act('delete-transaction', t('delete'), 'trash', 'button danger-text', `data-id="${e(id)}"`) : ''}${formActions()}`, 'transaction-form');
}
function recurringForm(id) {
  const r = state.data.recurringExpenses.find(x => x.id === id);
  const v = r || { title: '', amount: '', categoryId: 'home', frequency: 'monthly', startDate: today(), endDate: '', dueDay: Number(today().slice(8)), note: '', active: true };
  showDialog(t(r ? 'editRecurring' : 'addRecurring'), `${input('id', id || '', 'type="hidden"')}${field(t('billName'), input('title', v.title, 'required maxlength="200"'))}<div class="form-grid">${field(t('amount'), input('amount', v.amount, 'type="number" inputmode="numeric" min="1" max="999999999999" step="1" required'))}${field(t('category'), select('categoryId', FINANCE_CATEGORIES, v.categoryId, c => t(categoryLabel(c))))}${field(t('repeat'), select('frequency', ['weekly', 'monthly', 'yearly'], v.frequency))}${field(t('dueDay'), input('dueDay', v.dueDay, 'type="number" min="1" max="31" step="1" required'))}${field(t('startDate'), input('startDate', v.startDate, 'type="date" required min="1900-01-01" max="2200-12-31"'))}${field(t('endDate'), input('endDate', v.endDate, 'type="date" min="1900-01-01" max="2200-12-31"'))}</div>${hint(t('dueHelp'))}${field(t('note'), `<textarea name="note" maxlength="5000" rows="2">${e(v.note)}</textarea>`)}<label class="switch-row"><span>${e(t('active'))}</span><input type="checkbox" name="active" ${v.active ? 'checked' : ''}></label>${r ? act('delete-bill', t('delete'), 'trash', 'button danger-text', `data-id="${r.id}"`) : ''}${formActions()}`, 'recurring-form');
}
function noteForm() {
  showDialog(t('note'), `<p class="muted">${e(gregorian(state.selected, s().language))}</p>${field(t('reflection'), `<textarea name="content" maxlength="5000" rows="8">${e(state.data.notes[state.selected]?.content || '')}</textarea>`)}${hint(t('noteCharacters'))}${formActions()}`, 'note-form');
}
function quranForm() {
  const day = state.data.days[state.selected];
  showDialog(t('editProgress'), `<p>${e(gregorian(state.selected, s().language))}</p>${field(t('quranPages'), input('pages', day.completedPages, 'type="number" inputmode="numeric" min="0" max="100000" step="1" required'))}${hint(`${t('target')}: ${day.targetPages} ${t('pages')}`)}${formActions()}`, 'quran-form');
}
function locationForm() {
  const v = s();
  showDialog(t('location'), `${hint(t('geoHelp'))}${act('geolocate', t('useLocation'), 'pin', 'button secondary full')}${field(t('city'), `<select name="city"><option value="">${e(t('manual'))}</option>${CITIES.map((c, i) => `<option value="${i}">${e(c.name)}</option>`).join('')}</select>`)}${field(t('locationLabel'), input('locationLabel', v.locationLabel, 'maxlength="100" required'))}<div class="form-grid">${field(t('latitude'), input('latitude', v.latitude ?? '', 'type="number" min="-90" max="90" step="any" required dir="ltr"'))}${field(t('longitude'), input('longitude', v.longitude ?? '', 'type="number" min="-180" max="180" step="any" required dir="ltr"'))}</div>
    ${field(t('timezone'), input('timezone', v.timezone, 'required maxlength="100" dir="ltr" list="timezones"'))}<datalist id="timezones">${['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura', 'Asia/Riyadh', 'Asia/Kuala_Lumpur', 'Europe/London', 'America/New_York'].map(z => `<option value="${z}"></option>`).join('')}</datalist>${act('device-timezone', t('deviceTimezone'), '', 'button text')}${field(t('method'), select('prayerMethod', ['Singapore', 'MuslimWorldLeague', 'Egyptian', 'Karachi', 'UmmAlQura', 'NorthAmerica'], v.prayerMethod, key => key))}${field(t('asrMethod'), select('asrMethod', ['Shafi', 'Hanafi'], v.asrMethod))}<fieldset><legend>${e(t('offsets'))}</legend><div class="offset-grid">${PRAYERS.map(p => field(t(p), input(p, v.prayerOffsetsMinutes[p], 'type="number" min="-120" max="120" step="1" required'))).join('')}</div></fieldset>${hint(t('calculationNotice'))}${formActions()}`, 'location-form');
}
function calendarSettingsForm() {
  showDialog(t('calendarSettings'), `${field(t('hijriOffset'), select('hijriOffsetDays', [-2, -1, 0, 1, 2], s().hijriOffsetDays, n => num(n)))}${hint(t('estimated'))}${field(t('target'), input('quranTargetPages', s().quranTargetPages, 'type="number" inputmode="numeric" min="1" max="1000" step="1" required'))}${hint(t('targetHelp'))}${field(t('weekly'), select('weekStartsOn', [1, 0], s().weekStartsOn, n => gregorian(addDays('2026-10-18', n), s().language, { weekday: 'long', day: undefined, month: undefined, year: undefined })))}${formActions()}`, 'calendar-settings-form');
}
function remindersForm() {
  showDialog(t('reminders'), `${hint(t('remindersHelp'))}${[['enableMondayFastReminder', 'monday'], ['enableThursdayFastReminder', 'thursday'], ['enableAyyamulBidhReminder', 'ayyamul_bidh']].map(([name, label]) => `<label class="switch-row"><span>${e(t(label))}</span><input type="checkbox" name="${name}" ${s()[name] ? 'checked' : ''}></label>`).join('')}${formActions()}`, 'reminders-form');
}
function appearanceForm() {
  appearanceDraft ||= structuredClone(s());
  const v = appearanceDraft, colors = { ...THEMES[v.theme], ...v.colors };
  const desc = { claymorphism: 'clayDesc', neumorphism: 'neuDesc', glassmorphism: 'glassDesc', skeuomorphism: 'skeuDesc' };
  showDialog(t('appearance'), `<fieldset class="theme-fieldset"><legend>${e(t('theme'))}</legend><div class="theme-options">${Object.keys(THEMES).map(theme => `<label class="theme-option ${v.theme === theme ? 'chosen' : ''}"><input type="radio" name="theme" value="${theme}" ${v.theme === theme ? 'checked' : ''}><span class="mini-theme" data-preview-theme="${theme}"><i></i><i></i><i></i></span><strong>${e(t(theme))}</strong><small>${e(t(desc[theme]))}</small></label>`).join('')}</div></fieldset>
    ${field(t('colorMode'), select('colorMode', ['light', 'dark', 'system'], v.colorMode))}<fieldset><legend>${e(t('colors'))}</legend><div class="color-options">${['primary', 'accent', 'background', 'surface'].map(c => field(t(c), `<input type="color" name="color-${c}" value="${colors[c]}">`)).join('')}</div><p class="contrast-warning" ${contrast(colors.primary, colors.surface) >= 3 ? 'hidden' : ''}>${e(t('contrastWarning'))}</p>${act('auto-contrast', t('autoContrast'), '', 'button text')}</fieldset>
    <div class="form-grid">${field(t('font'), select('font', ['system', 'humanist', 'serif'], v.font, key => t(key === 'system' ? 'systemFont' : key)))}${field(t('arabicFont'), select('arabicFont', ['sans', 'serif'], v.arabicFont))}</div>${hint(t('fontHelp'))}
    ${field(t('fontSize'), `<div class="range-field"><input type="range" name="fontScale" min="85" max="140" step="5" value="${v.fontScale}"><output id="font-scale-value">${v.fontScale}%</output></div>`)}<div class="form-grid">${field(t('lineHeight'), select('lineHeight', [1.4, 1.5, 1.7], v.lineHeight, n => String(n)))}${field(t('density'), select('density', ['comfortable', 'compact'], v.density))}</div><label class="switch-row"><span>${e(t('reducedMotion'))}</span><input type="checkbox" name="reducedMotion" ${v.reducedMotion ? 'checked' : ''}></label>
    <details class="appearance-preview" open><summary>${e(t('preview'))}</summary><div class="card"><h3 class="hijri-date">${e(hijri(state.selected, s().hijriOffsetDays, s().language).label)}</h3><div class="preview-check">${icon('check')}${e(t('morning'))}</div><div class="preview-finance"><span>${e(t('balance'))}</span><strong>${money(0)}</strong></div><span class="button primary">${e(t('save'))}</span></div></details><div class="secondary-actions">${act('reset-appearance', t('reset'), '', 'button text')}</div><div class="form-actions">${act('close', t('cancel'))}<button type="submit" class="button primary">${e(t('apply'))}</button></div>`, 'appearance-form');
  applyAppearance(v);
}
function readAppearance() {
  const form = document.querySelector('#appearance-form'); if (!form) return;
  const values = new FormData(form);
  const chosen = values.get('theme');
  if (chosen !== appearanceDraft.theme) { appearanceDraft.theme = chosen; appearanceDraft.colors = {}; appearanceForm(); return; }
  for (const key of ['colorMode', 'font', 'arabicFont', 'density']) appearanceDraft[key] = values.get(key);
  for (const key of ['fontScale', 'lineHeight']) appearanceDraft[key] = Number(values.get(key));
  appearanceDraft.reducedMotion = values.has('reducedMotion');
  appearanceDraft.colors = Object.fromEntries(['primary', 'accent', 'background', 'surface'].map(key => [key, values.get(`color-${key}`)]));
  applyAppearance(appearanceDraft);
  document.querySelector('#font-scale-value').textContent = `${appearanceDraft.fontScale}%`;
  document.querySelector('.contrast-warning').hidden = contrast(appearanceDraft.colors.primary, appearanceDraft.colors.surface) >= 3;
}
function showCalendar(anchor = state.selected) {
  const h = hijri(anchor, s().hijriOffsetDays, s().language), first = addDays(anchor, 1 - h.day);
  let next = addDays(first, 29);
  if (hijri(next, s().hijriOffsetDays).month === h.month) next = addDays(next, 1);
  const start = addDays(first, -((weekday(first) - s().weekStartsOn + 7) % 7));
  const types = fastingTypes(state.selected, s());
  showDialog(t('calendar'), `<div class="calendar-header">${act('calendar-month', t('back'), 'chevron', 'icon-button previous', `data-date="${addDays(first, -1)}"`)}<h3>${e(hijri(first, s().hijriOffsetDays, s().language).label)}</h3>${act('calendar-month', t('next'), 'chevron', 'icon-button', `data-date="${next}"`)}</div><div class="calendar-grid weekdays">${Array.from({ length: 7 }, (_, i) => `<span>${e(gregorian(addDays('2026-10-18', (s().weekStartsOn + i) % 7), s().language, { weekday: 'short', day: undefined, month: undefined, year: undefined }))}</span>`).join('')}</div>
    <div class="calendar-grid">${Array.from({ length: 42 }, (_, i) => { const key = addDays(start, i), d = hijri(key, s().hijriOffsetDays), fasts = fastingTypes(key, s()); return `<button class="calendar-day ${d.month !== h.month ? 'outside' : ''} ${key === state.selected ? 'selected' : ''} ${key === today() ? 'is-today' : ''}" data-action="calendar-date" data-date="${key}" aria-label="${e(gregorian(key, s().language))}${fasts.length ? ' · ' + e(fasts.map(t).join(', ')) : ''}" ${key === state.selected ? 'aria-pressed="true"' : ''}><strong>${num(d.day)}</strong><small>${num(Number(key.slice(8)))}</small>${fasts.length ? '<span class="fast-dot" aria-hidden="true">✦</span>' : ''}</button>`; }).join('')}</div>
    <div class="calendar-detail"><strong>${e(hijri(state.selected, s().hijriOffsetDays, s().language).label)}</strong><p>${e(gregorian(state.selected, s().language))}</p>${types.length ? `<span class="badge">${icon('moon')}${e(types.map(t).join(' · '))}</span>${field(t('status'), `<select data-control="fasting" data-date="${state.selected}">${opts(['', 'planned', 'completed', 'skipped'], state.data.fasting[state.selected]?.status || '', value => t(value === '' ? 'unrecorded' : value === 'completed' ? 'doneFast' : value))}</select>`)}` : ''}<div class="secondary-actions">${act('calendar-routines', t('routines'), 'routines')}${act('note', t('note'), 'note')}${act('calendar-month', t('today'), '', 'button text', `data-date="${today()}"`)}</div></div>${hint(t('estimated'))}`);
}
function manageTemplates(kind) {
  const tasks = kind === 'tasks', rows = tasks ? state.data.tasks : state.data.recurringExpenses;
  showDialog(t(tasks ? 'manageTasks' : 'recurringTemplates'), `<div class="template-list">${rows.map(row => `<button class="template-row" data-action="${tasks ? 'edit-task' : 'edit-bill'}" data-id="${row.id}"><span><strong>${e(row.title)}</strong><small>${e(t(row.active ? 'active' : 'archived'))} · ${e(t(tasks ? row.scheduleType : row.frequency))}</small></span>${icon('edit')}</button>`).join('') || empty(t(tasks ? 'taskEmpty' : 'noBills'))}</div>${act(tasks ? 'add-task' : 'recurring', t(tasks ? 'addTask' : 'addRecurring'), 'plus', 'button primary full')}`);
}
let confirmCallback;
function confirmDelete(callback, label = t('deleteHelp')) {
  confirmCallback = callback;
  showDialog(t('deleteTitle'), `<p>${e(label)}</p><div class="form-actions">${act('close', t('cancel'))}${act('confirm-delete', t('delete'), 'trash', 'button destructive')}</div>`);
}
function downloadBackup() {
  const blob = new Blob([JSON.stringify(makeBackup(state.data), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = `yawm-${state.data.userId}-${today()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function previewImport(file) {
  try {
    if (!file || file.size > 5 * 1024 * 1024) throw new Error('INVALID_BACKUP');
    pendingImport = validateBackup(JSON.parse(await file.text()));
    const count = Object.keys(pendingImport.days).length + pendingImport.tasks.length + pendingImport.transactions.length + pendingImport.recurringExpenses.length + Object.keys(pendingImport.notes).length + Object.keys(pendingImport.fasting).length;
    showDialog(t('importPreview'), `<p><strong>${num(count)}</strong> ${e(t('records'))}</p><dl class="summary-list"><div><dt>${e(t('routines'))}</dt><dd>${num(Object.keys(pendingImport.days).length)}</dd></div><div><dt>${e(t('transactions'))}</dt><dd>${num(pendingImport.transactions.length)}</dd></div><div><dt>${e(t('note'))}</dt><dd>${num(Object.keys(pendingImport.notes).length)}</dd></div></dl>${hint(t('replaceHelp'))}${field(t('type'), select('mode', ['merge', 'replace'], 'merge'))}${formActions()}`, 'import-form');
  } catch { toast(t('invalidBackup'), true); }
}

const actions = {
  close: closeDialog,
  'login-language': () => { state.language = state.language === 'ar' ? 'id' : 'ar'; preference('yawm-language', state.language); renderLogin(); },
  'add-task': () => taskForm(), 'edit-task': el => taskForm(el.dataset.id),
  transaction: () => transactionForm(), 'edit-transaction': el => transactionForm(el.dataset.id),
  recurring: () => recurringForm(), 'edit-bill': el => recurringForm(el.dataset.id),
  note: noteForm, 'quran-edit': quranForm,
  'quran-plus': () => mutate(d => { const day = d.days[state.selected]; day.completedPages++; const item = day.items.find(i => i.templateKey === 'quran'); item.completed = day.completedPages >= day.targetPages; item.updatedAt = new Date().toISOString(); }),
  location: locationForm, 'calendar-settings': calendarSettingsForm, reminders: remindersForm,
  appearance: () => { appearanceDraft = structuredClone(s()); appearanceForm(); },
  'reset-appearance': () => { const language = s().language; for (const key of ['theme', 'colorMode', 'colors', 'font', 'arabicFont', 'fontScale', 'lineHeight', 'density', 'reducedMotion']) appearanceDraft[key] = structuredClone(DEFAULT_SETTINGS[key]); appearanceDraft.language = language; appearanceForm(); },
  'auto-contrast': () => { appearanceDraft.colors = { ...appearanceDraft.colors, primary: THEMES[appearanceDraft.theme].primary, surface: THEMES[appearanceDraft.theme].surface, background: THEMES[appearanceDraft.theme].background }; appearanceForm(); },
  language: () => showDialog(t('language'), `${field(t('language'), select('language', ['id', 'ar'], s().language, key => key === 'ar' ? 'العربية' : 'Indonesia'))}${formActions()}`, 'language-form'),
  profile: () => showDialog(t('profile'), `${field(t('displayName'), input('displayName', s().displayName, 'maxlength="80"'))}${formActions()}`, 'profile-form'),
  logout: async () => { await mutationQueue; preference('yawm-user', null); state.language = s().language; state.data = null; state.selected = dateKey(); state.screen = 'home'; render(); },
  'date-prev': () => navigate(state.screen, addDays(state.selected, -1)), 'date-next': () => navigate(state.screen, addDays(state.selected, 1)), 'date-today': () => navigate(state.screen, today()),
  calendar: () => showCalendar(), 'calendar-month': el => showCalendar(el.dataset.date),
  'calendar-date': async el => { await navigate(['home', 'routines'].includes(state.screen) ? state.screen : 'routines', el.dataset.date); showCalendar(el.dataset.date); },
  'calendar-routines': () => { closeDialog(); navigate('routines'); },
  'manage-tasks': () => manageTemplates('tasks'), 'manage-bills': () => manageTemplates('bills'),
  'archive-task': el => archiveTask(el.dataset.id, false), 'restore-task': el => archiveTask(el.dataset.id, true),
  'delete-task': el => confirmDelete(async () => { await mutate(d => { d.tasks = d.tasks.filter(t => t.id !== el.dataset.id); for (const [key, day] of Object.entries(d.days)) if (key >= today()) day.items = day.items.filter(i => i.id !== el.dataset.id || i.completed); }); closeDialog(); }),
  'delete-transaction': el => confirmDelete(async () => { await mutate(d => { d.transactions = d.transactions.filter(t => t.id !== el.dataset.id); }); closeDialog(); }),
  'delete-bill': el => confirmDelete(async () => { await mutate(d => { d.recurringExpenses = d.recurringExpenses.filter(r => r.id !== el.dataset.id); }); closeDialog(); }),
  'confirm-delete': async () => { const fn = confirmCallback; confirmCallback = null; await fn?.(); },
  'pay-bill': el => transactionForm(null, state.data.recurringExpenses.find(r => r.id === el.dataset.id), el.dataset.date),
  export: downloadBackup, import: () => document.querySelector('#backup-file').click(),
  'delete-data': () => showDialog(t('deleteData'), `<p>${e(t('deleteDataHelp'))}</p>${field(t('typeDelete'), input('confirmation', '', 'required pattern="HAPUS" autocomplete="off"'))}<div class="form-actions">${act('close', t('cancel'))}<button class="button destructive" type="submit">${e(t('deleteData'))}</button></div>`, 'delete-data-form'),
  geolocate: el => {
    if (!navigator.geolocation) return toast(t('geoError'), true);
    el.disabled = true;
    navigator.geolocation.getCurrentPosition(position => {
      const form = document.querySelector('#location-form'); if (!form) return;
      form.elements.latitude.value = position.coords.latitude.toFixed(6); form.elements.longitude.value = position.coords.longitude.toFixed(6);
      form.elements.locationLabel.value = t('deviceLocation'); form.elements.timezone.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
      el.disabled = false;
    }, () => { el.disabled = false; toast(t('geoError'), true); }, { timeout: 15000, maximumAge: 300000 });
  },
  'device-timezone': () => { document.querySelector('#location-form').elements.timezone.value = Intl.DateTimeFormat().resolvedOptions().timeZone; },
  install: async () => { if (installPrompt) { await installPrompt.prompt(); installPrompt = null; } else toast(t('installHelp')); },
};
async function archiveTask(id, active) {
  const ok = await mutate(d => {
    const task = d.tasks.find(t => t.id === id); task.active = active; task.updatedAt = new Date().toISOString();
    if (!active) for (const [key, day] of Object.entries(d.days)) if (key >= today()) day.items = day.items.filter(i => i.id !== id || i.completed);
    if (active) ensureDay(d, state.selected);
  }); if (ok) closeDialog();
}

document.addEventListener('click', async event => {
  const nav = event.target.closest('[data-nav]');
  if (nav) { event.preventDefault(); await mutationQueue; await navigate(nav.dataset.nav); return; }
  const period = event.target.closest('[data-period]');
  if (period) { state.period = period.dataset.period; render(); return; }
  const button = event.target.closest('[data-action]');
  if (button && !button.disabled) {
    try { await actions[button.dataset.action]?.(button); }
    catch (error) { console.error(error); toast(t('invalid'), true); }
  }
});
document.addEventListener('change', async event => {
  const el = event.target;
  if (el.matches('[data-item]')) {
    const completed = el.checked, id = el.dataset.item;
    el.disabled = true;
    const ok = await mutate(d => {
      const item = d.days[state.selected].items.find(i => i.id === id);
      item.completed = completed; item.updatedAt = new Date().toISOString(); item.completedAt = completed ? item.updatedAt : null;
    }, '');
    if (!ok) { el.checked = !completed; el.disabled = false; }
  }
  if (el.dataset.control === 'date' && el.value) await navigate(state.screen, el.value);
  if (['month', 'financeStart', 'financeEnd', 'category', 'status', 'priority'].includes(el.dataset.control) && el.value) {
    if (!el.validity.valid) { toast(t('invalid'), true); return; }
    state[el.dataset.control] = el.value;
    if (el.dataset.control === 'month') { state.financeStart = ''; state.financeEnd = ''; }
    render();
  }
  if (el.dataset.control === 'fasting') { const key = el.dataset.date; await mutate(d => { d.fasting[key] = { userId: d.userId, status: el.value, updatedAt: new Date().toISOString() }; }); }
  if (el.id === 'backup-file') await previewImport(el.files[0]);
  if (el.name === 'city' && el.value !== '') {
    const city = CITIES[Number(el.value)], form = el.form;
    for (const key of ['latitude', 'longitude', 'timezone']) form.elements[key].value = city[key];
    form.elements.locationLabel.value = city.name;
  }
});
document.addEventListener('input', event => { if (event.target.closest('#appearance-form')) readAppearance(); });
modal.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
modal.addEventListener('click', event => { if (event.target === modal) { const rect = modal.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(); } });

document.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target, values = new FormData(form), v = Object.fromEntries(values);
  if (busy) return;
  if (form.getAttribute('id') === 'login-form') {
    const user = USERS.find(u => u.id === v.userId && u.enabled); if (!user) return;
    busy = true;
    try {
      const data = await loadProfile(user.id); validateBackup(makeBackup(data));
      data.settings.language = state.language;
      const key = dateKey(new Date(), data.settings.timezone); ensureDay(data, key); await saveProfile(data);
      state.data = data; state.selected = key; state.month = key.slice(0, 7); preference('yawm-user', user.id); applyAppearance(s()); render();
    } catch { form.querySelector('.form-error').textContent = t('storageError'); }
    finally { busy = false; } return;
  }
  busy = true;
  const submit = form.querySelector('[type=submit]'); if (submit) submit.disabled = true;
  try {
    let update;
    if (form.getAttribute('id') === 'task-form') {
      if (!v.title.trim() || (v.scheduleType === 'weekly' && !values.getAll('weekdays').length) || (values.has('reminder') && !v.time)) throw new Error('INVALID');
      update = d => {
        const old = d.tasks.find(t => t.id === v.id), id = old?.id || crypto.randomUUID(), now = new Date().toISOString();
        const task = { id, userId: d.userId, title: v.title.trim(), description: v.description, category: v.category, date: v.date, scheduleType: v.scheduleType,
          time: v.time, reminder: values.has('reminder'), priority: v.priority, weekdays: values.getAll('weekdays').map(Number), active: old?.active ?? true, createdAt: old?.createdAt || now, updatedAt: now };
        d.tasks = [...d.tasks.filter(t => t.id !== id), task];
        for (const [key, day] of Object.entries(d.days)) if (key >= today()) {
          const item = day.items.find(i => i.id === id);
          if (item && !item.completed) {
            if (!scheduled(task, key)) day.items = day.items.filter(i => i.id !== id);
            else Object.assign(item, { title: task.title, category: task.category, description: task.description, priority: task.priority, time: task.time });
          }
        }
        ensureDay(d, state.selected);
      };
    } else if (form.getAttribute('id') === 'transaction-form') {
      if (!v.title.trim() || !Number.isSafeInteger(Number(v.amount)) || Number(v.amount) <= 0 || (v.recurringExpenseId && v.type !== 'expense')) throw new Error('INVALID');
      update = d => {
        if (v.recurringExpenseId && d.transactions.some(t => t.id !== v.id && t.recurringExpenseId === v.recurringExpenseId && t.occurrenceDate === v.occurrenceDate)) throw new Error('DUPLICATE_PAYMENT');
        const old = d.transactions.find(tx => tx.id === v.id), now = new Date().toISOString();
        const tx = { id: old?.id || crypto.randomUUID(), userId: d.userId, type: v.type, amount: Number(v.amount), date: v.date, categoryId: v.categoryId, title: v.title.trim(), note: v.note,
          recurringExpenseId: v.recurringExpenseId || null, occurrenceDate: v.occurrenceDate || null, createdAt: old?.createdAt || now, updatedAt: now };
        d.transactions = [...d.transactions.filter(t => t.id !== tx.id), tx];
      };
    } else if (form.getAttribute('id') === 'recurring-form') {
      if (!v.title.trim() || (v.endDate && v.endDate < v.startDate)) throw new Error('INVALID');
      update = d => {
        const old = d.recurringExpenses.find(r => r.id === v.id), now = new Date().toISOString();
        const r = { id: old?.id || crypto.randomUUID(), userId: d.userId, title: v.title.trim(), amount: Number(v.amount), categoryId: v.categoryId, frequency: v.frequency,
          startDate: v.startDate, endDate: v.endDate, dueDay: Number(v.dueDay), active: values.has('active'), note: v.note, createdAt: old?.createdAt || now, updatedAt: now };
        d.recurringExpenses = [...d.recurringExpenses.filter(t => t.id !== r.id), r];
      };
    } else if (form.getAttribute('id') === 'quran-form') {
      update = d => { const day = d.days[state.selected]; day.completedPages = Number(v.pages); const item = day.items.find(i => i.templateKey === 'quran'); item.completed = day.completedPages >= day.targetPages; item.updatedAt = new Date().toISOString(); };
    } else if (form.getAttribute('id') === 'note-form') {
      update = d => { if (v.content.trim()) d.notes[state.selected] = { userId: d.userId, content: v.content, updatedAt: new Date().toISOString() }; else delete d.notes[state.selected]; };
    } else if (form.getAttribute('id') === 'location-form') {
      const candidate = { ...s(), latitude: Number(v.latitude), longitude: Number(v.longitude), timezone: v.timezone.trim(), locationLabel: v.locationLabel.trim(), prayerMethod: v.prayerMethod, asrMethod: v.asrMethod,
        prayerOffsetsMinutes: Object.fromEntries(PRAYERS.map(p => [p, Number(v[p])])) };
      validateSettings(candidate); update = d => { d.settings = candidate; };
    } else if (form.getAttribute('id') === 'calendar-settings-form') {
      update = d => Object.assign(d.settings, { hijriOffsetDays: Number(v.hijriOffsetDays), quranTargetPages: Number(v.quranTargetPages), weekStartsOn: Number(v.weekStartsOn) }) && undefined;
    } else if (form.getAttribute('id') === 'reminders-form') {
      update = d => { for (const key of ['enableMondayFastReminder', 'enableThursdayFastReminder', 'enableAyyamulBidhReminder']) d.settings[key] = values.has(key); };
    } else if (form.getAttribute('id') === 'language-form') {
      update = d => { d.settings.language = v.language; }; state.language = v.language; preference('yawm-language', v.language);
    } else if (form.getAttribute('id') === 'profile-form') {
      update = d => { d.settings.displayName = v.displayName.trim(); };
    } else if (form.getAttribute('id') === 'appearance-form') {
      const appearance = structuredClone(appearanceDraft); validateSettings(appearance); update = d => { d.settings = appearance; };
    } else if (form.getAttribute('id') === 'import-form') {
      if (!pendingImport) throw new Error('INVALID');
      if (v.mode === 'replace' && !form.dataset.confirmed) {
        form.dataset.confirmed = 'true'; submit.textContent = t('confirm'); const error = form.querySelector('.form-error'); error.textContent = t('replaceHelp'); return;
      }
      update = d => { const restored = restoreBackup(d, pendingImport, v.mode); ensureDay(restored, state.selected); return restored; };
    } else if (form.getAttribute('id') === 'delete-data-form') {
      if (v.confirmation !== 'HAPUS') throw new Error('INVALID');
      update = d => { const empty = emptyProfile(d.userId); ensureDay(empty, state.selected); return empty; };
    }
    if (update) { const ok = await mutate(update); if (ok) { appearanceDraft = null; pendingImport = null; closeDialog(); } }
  } catch (error) { console.error(error); const errorEl = form.querySelector('.form-error'); if (errorEl) errorEl.textContent = t('invalid'); }
  finally { busy = false; if (submit) submit.disabled = false; }
});

let previousToday;
const shownReminders = new Set();
async function updateClock() {
  if (!state.data) return;
  const nowKey = today();
  if (previousToday && previousToday !== nowKey && state.selected === previousToday && !busy && !modal.open) { state.selected = nowKey; await navigate(state.screen, nowKey); }
  previousToday = nowKey;
  const nowTime = new Intl.DateTimeFormat('en-GB', { timeZone: s().timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format();
  for (const task of state.data.tasks) {
    const reminderKey = `${state.data.userId}:${nowKey}:${task.id}`;
    if (task.reminder && task.time === nowTime && scheduled(task, nowKey) && !shownReminders.has(reminderKey) && !state.data.days[nowKey]?.items.find(i => i.id === task.id)?.completed) {
      shownReminders.add(reminderKey); toast(`${t('reminderDue')}: ${task.title}`);
    }
  }
  const next = nextPrayer(s());
  const counter = document.querySelector('#countdown');
  if (counter && next) {
    counter.textContent = countdown(next.time);
    document.querySelector('#next-name').textContent = t(next.name);
    document.querySelector('#next-time').textContent = timeLabel(next.time, s());
    for (const el of document.querySelectorAll('[data-prayer]')) el.classList.toggle('current', el.dataset.prayer === next.name);
  }
}
window.addEventListener('online', render); window.addEventListener('offline', render);
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyAppearance(appearanceDraft || s()));
setInterval(updateClock, 1000);

async function boot() {
  try {
    await openDB();
    const userId = readPreference('yawm-user');
    if (USERS.some(u => u.id === userId && u.enabled)) {
      const data = await loadProfile(userId); validateBackup(makeBackup(data));
      const key = dateKey(new Date(), data.settings.timezone); ensureDay(data, key); await saveProfile(data);
      state.data = data; state.selected = key; state.month = key.slice(0, 7);
    }
    applyAppearance(s()); render();
  } catch (error) {
    console.error(error);
    app.innerHTML = `<main class="startup-error"><h1>Yawm</h1><p>${e(t('storageError'))}</p>${act('reload', t('retry'), '', 'button primary')}</main>`;
    actions.reload = () => location.reload();
  }
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    try { const registration = await navigator.serviceWorker.register('/service-worker.js'); await navigator.serviceWorker.ready; state.cache = 'cacheReady'; if (state.screen === 'settings') render(); registration.update().catch(() => {}); }
    catch { state.cache = 'cacheError'; if (state.screen === 'settings') render(); }
  } else state.cache = 'cacheError';
}
boot();

