export const THEMES = {
  claymorphism: { primary: '#26765d', accent: '#c39851', background: '#f4f5ef', surface: '#ffffff' },
  neumorphism: { primary: '#276b55', accent: '#bd9346', background: '#e8ece7', surface: '#e8ece7' },
  glassmorphism: { primary: '#216c56', accent: '#bc934b', background: '#edf3ef', surface: '#f8fcfa' },
  skeuomorphism: { primary: '#23664f', accent: '#b4893e', background: '#f0eee7', surface: '#fbfaf6' },
};
export const DEFAULT_SETTINGS = {
  language: 'id', displayName: '', theme: 'claymorphism', colorMode: 'light', colors: {},
  font: 'system', arabicFont: 'sans', fontScale: 100, lineHeight: 1.5, density: 'comfortable', reducedMotion: false,
  hijriOffsetDays: 0, quranTargetPages: 2, timezone: 'Asia/Jakarta', weekStartsOn: 1,
  latitude: null, longitude: null, locationLabel: '', prayerMethod: 'Singapore', asrMethod: 'Shafi',
  prayerOffsetsMinutes: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
  enableMondayFastReminder: true, enableThursdayFastReminder: true, enableAyyamulBidhReminder: true,
};
export const TASK_CATEGORIES = ['islami', 'kesehatan', 'produktivitas', 'olahraga'];
export const FINANCE_CATEGORIES = ['daily', 'food', 'transport', 'home', 'education', 'health', 'charity', 'leisure', 'other'];
export const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
export const DEFAULT_ITEMS = ['rawatib', 'morning', 'evening', 'duha', 'quran', 'bedtime'];
export const LEGACY_DEFAULT_ITEMS = [...PRAYERS, ...DEFAULT_ITEMS];
export const createDefaultHabits = userId => DEFAULT_ITEMS.map(templateKey => ({
  id: `default:${templateKey}`, userId, templateKey, title: '', description: '', category: 'islami',
  date: '1900-01-01', scheduleType: 'daily', weekdays: [0, 1, 2, 3, 4, 5, 6],
  priority: 'normal', active: true, time: '', reminder: false, calendar: 'hijri',
}));
export const CITIES = [
  { name: 'Jakarta', latitude: -6.2088, longitude: 106.8456, timezone: 'Asia/Jakarta' },
  { name: 'Bandung', latitude: -6.9175, longitude: 107.6191, timezone: 'Asia/Jakarta' },
  { name: 'Surabaya', latitude: -7.2575, longitude: 112.7521, timezone: 'Asia/Jakarta' },
  { name: 'Yogyakarta', latitude: -7.7956, longitude: 110.3695, timezone: 'Asia/Jakarta' },
  { name: 'Medan', latitude: 3.5952, longitude: 98.6722, timezone: 'Asia/Jakarta' },
  { name: 'Makassar', latitude: -5.1477, longitude: 119.4327, timezone: 'Asia/Makassar' },
  { name: 'Jayapura', latitude: -2.5337, longitude: 140.7181, timezone: 'Asia/Jayapura' },
  { name: 'Makkah', latitude: 21.4225, longitude: 39.8262, timezone: 'Asia/Riyadh' },
];
