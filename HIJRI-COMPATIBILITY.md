# Hijri compatibility fix — 2026-10-24

Previously both Hijri conversion and labels depended on the browser honoring Intl's islamic-umalqura calendar request. Unsupported implementations could return Gregorian parts/labels without any validation. The exact affected Android device has not been inspected, so this is a confirmed code weakness and a plausible explanation of the report, not a device-specific diagnosis.

All clients now use a committed, compact ICU Umm al-Qura calendar snapshot and explicit Indonesian/Arabic month labels. Conversion and labels no longer call browser Intl. This covers the application's 1900–2200 input range with surrounding padding for offsets and month navigation. Internal ISO date storage and intentional secondary Gregorian captions remain unchanged.

The data records its ICU version and is regenerated only via scripts/generate-hijri-calendar.js, never automatically during normal builds. Beyond ICU's observational data interval its existing approximation is retained; this is not a claim of future moon-sighting accuracy. Existing user date adjustments still apply.

Validation: 24 tests passed; production build and git diff --check passed. Tests simulate Gregorian fallback and rejection of Intl formatting, exercise labels, reverse conversion, month boundaries, fasting and recurrence, and compare 3,612 sampled dates across 1900–2200 with the supported native calendar. Date-offset tests include both input-range endpoints. No physical Android device verification performed. Added production JS gzip is approximately 1 KB.

After deployment, an installed PWA may retain the old version until all app tabs/windows are closed and the app is reopened online. Do not clear site storage: daily records live in IndexedDB.
