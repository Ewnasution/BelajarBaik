import { activitiesForDate } from '../services/agenda.js';
import { addDays, weekday, hijri, hijriMonthRange, hijriMonthLabel, gregorian, fastingTypes } from '../services/dates.js';
import { activityRows } from './dashboard.js';

export function renderCalendar(c, anchor) {
  const { state, s, t, today, e, num, act, icon, field, opts, hint } = c;
  const h = hijri(anchor, s().hijriOffsetDays), range = hijriMonthRange(anchor, s().hijriOffsetDays);
  const start = addDays(range.start, -((weekday(range.start) - s().weekStartsOn + 7) % 7));
  const types = fastingTypes(state.selected, s()), activities = activitiesForDate(state.data, state.selected);
  return `<div class="calendar-header">${act('calendar-month', t('back'), 'chevron', 'icon-button previous', `data-date="${addDays(range.start, -1)}"`)}<h3>${e(hijriMonthLabel(anchor, s().hijriOffsetDays, s().language))}</h3>${act('calendar-month', t('next'), 'chevron', 'icon-button', `data-date="${range.next}"`)}</div>
    <details class="calendar-jump"><summary>${e(t('hijriDate'))}</summary>${c.hijriDateField(t('hijriDate'), 'calendarAnchor', anchor, false, 'calendarAnchor')}</details>
    <div class="calendar-grid weekdays">${Array.from({ length: 7 }, (_, i) => `<span>${e(gregorian(addDays('2026-10-18', (s().weekStartsOn + i) % 7), s().language, { weekday: 'short', day: undefined, month: undefined, year: undefined }))}</span>`).join('')}</div>
    <div class="calendar-grid">${Array.from({ length: 42 }, (_, i) => {
      const key = addDays(start, i), d = hijri(key, s().hijriOffsetDays), fasts = fastingTypes(key, s()), count = activitiesForDate(state.data, key).length;
      return `<button class="calendar-day ${d.month !== h.month ? 'outside' : ''} ${key === state.selected ? 'selected' : ''} ${key === today() ? 'is-today' : ''}" data-action="calendar-date" data-date="${key}" aria-label="${e(hijri(key, s().hijriOffsetDays, s().language).label)} · ${num(count)} ${e(t('eventCount'))}${fasts.length ? ' · ' + e(fasts.map(t).join(', ')) : ''}" aria-pressed="${key === state.selected}"><strong>${num(d.day)}</strong><small>${num(Number(key.slice(8)))}</small>${count ? `<span class="calendar-activity-count">${num(count)}</span>` : ''}${fasts.length ? '<span class="fast-dot" aria-hidden="true">✦</span>' : ''}</button>`;
    }).join('')}</div><div class="calendar-detail"><strong>${e(hijri(state.selected, s().hijriOffsetDays, s().language).label)}</strong><p>${e(gregorian(state.selected, s().language))}</p>${types.length ? `<span class="badge">${icon('moon')}${e(types.map(t).join(' · '))}</span>${field(t('status'), `<select data-control="fasting" data-date="${state.selected}">${opts(['', 'planned', 'completed', 'skipped'], state.data.fasting[state.selected]?.status || '', value => t(value === '' ? 'unrecorded' : value === 'completed' ? 'doneFast' : value))}</select>`)}` : ''}
    <h3>${e(t('agenda'))}</h3>${activities.length ? activityRows(c, activities) : hint(t('noEvents'))}<div class="secondary-actions">${act('add-event', t('addEvent'), 'calendar')}${act('add-task', t('addTodo'), 'plus')}${act('calendar-routines', t('habitTracker'), 'routines')}${act('note', t('note'), 'note')}${act('calendar-date', t('today'), '', 'button text', `data-date="${today()}"`)}</div></div>${hint(`${t('hijriCalendar')} · ${t('gregorianCalendar')}: ${t('estimated')}`)}`;
}
