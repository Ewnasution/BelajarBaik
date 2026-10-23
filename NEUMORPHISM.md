# Yawm — Neumorphism update

Scope: only the Neumorphism theme. Existing themes, chosen profile theme, data, routes and business workflows are retained. No dependencies added. Soft is the default variant within Neumorphism; existing profiles are not forcibly switched.

## Design foundation

Centralized in `src/styles/neumorphism.css`, with editable palette defaults in `src/data/presets.js`. Pearl #F7F8F7, white #FFFFFF, soft surface #F2F5F3, teal #087F70, orange #F28B45, text #263936, border #E8ECE9. Secondary readable text uses #62716B instead of the supplied #89938F for contrast. Warning/danger foregrounds are also darkened for readability. Radius scale 8/12/16/22/28px; spacing 4px-based; ordinary metadata minimum 12px. Font stack uses locally available Inter/Plus Jakarta Sans/system sans, without font downloads.

Flat bordered data cards, selectively raised controls and Quran/prayer widgets, inset input surfaces, restrained dark-mode shadows. Glass blur is restricted to overlays and the floating navigation. No new decorative assets or animation dependencies.

## Preferences

Pengaturan → Personalisasi tampilan → Neumorphism. Variants: Soft Neumorphism, Clean Minimal, Subtle Glass, High Contrast. Users can change palette, font family/size, line height, density, shadow intensity, corner scale, heading scale/weight and light/dark appearance. Text/border and spacing tokens are centralized in CSS. Reset restores Soft defaults while keeping the Neumorphism theme. New values are validated during save/import, with safe rendering fallbacks and compatibility for older backups.

## Responsive and accessibility

Mobile dates use a four-column wrapping grid so all seven dates remain readable. Navigation remains visible; dialogs fit the viewport. Shared 44px controls, visible focus, explicit form labels and status text remain. Input boundaries have stronger contrast than decorative card borders. Reduced-motion settings and system preference are respected.

## Verification performed

- 22 automated tests passed, including preference validation, legacy compatibility, safe fallback and switching away from Neumorphism.
- Production Vite build passed; no added dependency.
- Browser: all five main pages at 360px; Home additionally at 390, 768, 1024, 1440px. No document horizontal overflow observed.
- Four variants switched successfully. Light/dark rendering, reset, persisted theme after reload, to-do creation and completion verified.
- No browser console errors recorded during the checked flow.
- Screenshot: `artifacts/yawm-neumorphism.jpg`.

## Files

Created: `src/styles/neumorphism.css`, `tests/appearance.test.js`, this report, screenshot.

Modified: `src/app.js`, `src/data/presets.js`, `src/i18n.js`, `src/services/appearance.js`, `src/services/backup.js`.

## Limits

No reference image was attached; implementation follows the written specification. Browser checks used a fresh local preview profile, not production records. Physical devices, Safari, screen readers and every custom color combination were not exhaustively tested. Font appearance depends on fonts installed locally. No Vercel deployment performed.
