import { THEMES } from '../data/presets.js';
export function luminance(hex) {
  const values = hex.slice(1).match(/../g).map(c => parseInt(c, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
}
export function contrast(a, b) {
  const l1 = luminance(a), l2 = luminance(b);
  return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
}
export const readable = bg => contrast(bg, '#20352b') >= 4.5 ? '#20352b' : contrast(bg, '#ffffff') >= 4.5 ? '#ffffff' : '#000000';
export function applyAppearance(settings) {
  const root = document.documentElement;
  const neu = settings.theme === 'neumorphism';
  root.dataset.neuVariant = ['soft', 'minimal', 'glass', 'contrast'].includes(settings.neuVariant) ? settings.neuVariant : 'soft';
  for (const [key, allowed, fallback, token] of [
    ['neuDepth', [0, .5, 1], 1, 'depth'], ['neuRadius', [.75, 1, 1.25], 1, 'radius'],
    ['neuHeading', [.9, 1, 1.1], 1, 'heading'], ['neuWeight', [500, 600, 650], 600, 'weight']
  ]) root.style.setProperty('--neu-' + token, allowed.includes(settings[key]) ? settings[key] : fallback);
  root.dataset.theme = settings.theme;
  const dark = settings.colorMode === 'dark' || (settings.colorMode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  root.dataset.colorMode = dark ? 'dark' : 'light';
  root.dataset.density = settings.density;
  root.dataset.motion = settings.reducedMotion ? 'reduced' : 'normal';
  root.lang = settings.language;
  root.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
  const colors = { ...THEMES[settings.theme], ...settings.colors };
  if (dark) { colors.background = '#14231e'; colors.surface = '#1e3028'; }
  for (const [key, value] of Object.entries(colors)) root.style.setProperty(`--color-${{ background: 'bg' }[key] || key}`, value);
  root.style.setProperty('--color-on-primary', readable(colors.primary));
  root.style.setProperty('--color-primary-ink', contrast(colors.primary, colors.surface) >= 4.5 ? colors.primary : readable(colors.surface));
  root.style.setProperty('--color-text', readable(colors.surface));
  root.style.setProperty('--color-page-text', readable(colors.background));
  root.style.setProperty('--color-text-muted', readable(colors.surface) === '#ffffff' ? '#c0cec5' : '#5d6c63');
  root.style.setProperty('--font-size-scale', settings.fontScale / 100);
  root.style.setProperty('--line-height', settings.lineHeight);
  root.style.setProperty('--font-ui', settings.language === 'ar' ? 'var(--font-arabic)' : settings.font === 'serif' ? 'Georgia, Cambria, serif' : settings.font === 'humanist' ? 'Verdana, sans-serif' : '"Segoe UI", system-ui, sans-serif');
  root.style.setProperty('--font-arabic', settings.arabicFont === 'serif' ? '"Traditional Arabic", "Times New Roman", serif' : 'Tahoma, Arial, sans-serif');
  if (neu) {
    const ink = contrast('#263936', colors.surface) >= 4.5 ? '#263936' : readable(colors.surface);
    root.style.setProperty('--color-text', ink);
    root.style.setProperty('--color-text-muted', contrast('#62716b', colors.surface) >= 4.5 ? '#62716b' : ink);
    if (settings.font === 'system' && settings.language !== 'ar') root.style.setProperty('--font-ui', 'Inter, "Plus Jakarta Sans", system-ui, -apple-system, sans-serif');
    if (root.dataset.neuVariant === 'contrast') root.style.setProperty('--color-text-muted', ink);
  }
  document.querySelector('meta[name="theme-color"]').content = colors.primary;
}
