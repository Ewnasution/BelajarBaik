import test from 'node:test';
import assert from 'node:assert/strict';
import { hijri, hijriMonthLabel, hijriMonthRange, fromHijri, scheduled, fastingTypes } from '../src/services/dates.js';
import { DEFAULT_SETTINGS } from '../src/data/presets.js';

test('Hijri dates, labels and workflows work without browser Hijri support', () => {
  const original = Intl.DateTimeFormat;
  try {
    // Some runtimes ignore the requested calendar, others reject it entirely.
    for (const mode of ['gregorian-fallback', 'unsupported']) {
      Intl.DateTimeFormat = function (locale, options) {
        if (mode === 'unsupported') throw new RangeError('Calendar unavailable');
        return new original('en', { ...options, calendar: 'gregory' });
      };
      assert.deepEqual(hijri('2026-10-24'), { label: '13 Jumadilawal 1448 H', day: 13, month: 5, year: 1448 });
      assert.equal(hijriMonthLabel('2026-10-24'), 'Jumadilawal 1448 H');
      assert.equal(hijri('2026-10-24', 0, 'ar').label, '١٣ جمادى الأولى ١٤٤٨ هـ');
      assert.equal(fromHijri(1448, 5, 13), '2026-10-24');
      assert.equal(hijriMonthRange('2026-10-24').start, '2026-10-12');
      assert.ok(fastingTypes('2026-10-24', DEFAULT_SETTINGS).includes('ayyamul_bidh'));
      assert.ok(scheduled({ active: true, date: '2026-10-24', scheduleType: 'monthly', calendar: 'hijri' }, '2026-10-24'));
    }
  } finally { Intl.DateTimeFormat = original; }
});

test('pinned calendar agrees with supported ICU across 1900–2200', () => {
  const format = new Intl.DateTimeFormat('en', { calendar: 'islamic-umalqura', numberingSystem: 'latn', timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric' });
  assert.equal(format.resolvedOptions().calendar, 'islamic-umalqura');
  for (let year = 1900; year <= 2200; year++) for (let month = 1; month <= 12; month++) {
    const key = `${year}-${String(month).padStart(2, '0')}-15`;
    const expected = Object.fromEntries(format.formatToParts(new Date(`${key}T00:00:00Z`)).map(p => [p.type, p.value]));
    const actual = hijri(key);
    for (const part of ['year', 'month', 'day']) assert.equal(actual[part], Number(expected[part]), `${key}: ${part}`);
  }
  for (const key of ['1900-01-01', '2200-12-31', '2024-02-29']) for (const offset of [-2, 0, 2]) {
    const h = hijri(key, offset);
    assert.equal(fromHijri(h.year, h.month, h.day, offset), key);
  }
});
