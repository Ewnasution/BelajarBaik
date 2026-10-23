import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, THEMES } from '../src/data/presets.js';
import { applyAppearance, contrast } from '../src/services/appearance.js';
import { validateSettings } from '../src/services/backup.js';

test('Neumorphism preferences validate while older backups remain compatible', () => {
  assert.doesNotThrow(() => validateSettings(structuredClone(DEFAULT_SETTINGS)));
  for (const neuVariant of ['soft', 'minimal', 'glass', 'contrast']) {
    assert.doesNotThrow(() => validateSettings({ ...DEFAULT_SETTINGS, theme: 'neumorphism', neuVariant, neuDepth: .5, neuRadius: 1.25, neuHeading: 1.1, neuWeight: 650 }));
  }
  for (const invalid of [{ neuVariant: 'unknown' }, { neuDepth: -1 }, { neuRadius: '1' }, { neuHeading: 8 }, { neuWeight: 10 }]) {
    assert.throws(() => validateSettings({ ...DEFAULT_SETTINGS, ...invalid }));
  }
});

test('appearance falls back safely and switching themes removes Neumorphism typography', () => {
  const original = globalThis.document;
  const properties = new Map();
  const root = { dataset: {}, style: { setProperty: (key, value) => properties.set(key, value) } };
  globalThis.document = { documentElement: root, querySelector: () => ({ content: '' }) };
  try {
    applyAppearance({ ...DEFAULT_SETTINGS, theme: 'neumorphism', neuVariant: 'unsafe', neuDepth: 99 });
    assert.equal(root.dataset.neuVariant, 'soft');
    assert.equal(properties.get('--neu-depth'), 1);
    assert.match(properties.get('--font-ui'), /Inter/);
    assert.ok(contrast(properties.get('--color-text-muted'), THEMES.neumorphism.surface) >= 4.5);
    assert.ok(contrast(properties.get('--color-on-primary'), THEMES.neumorphism.primary) >= 4.5);
    applyAppearance(DEFAULT_SETTINGS);
    assert.equal(root.dataset.theme, 'claymorphism');
    assert.doesNotMatch(properties.get('--font-ui'), /Inter/);
  } finally { globalThis.document = original; }
});
