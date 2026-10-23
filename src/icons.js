const paths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  routines: '<rect x="4" y="4" width="16" height="17" rx="3"/><path d="M9 4V2m6 2V2M8 10l2 2 5-5M8 16h8"/>',
  finance: '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 8h18m-5 4h5v5h-5a2.5 2.5 0 0 1 0-5Z"/>',
  analytics: '<path d="M4 3v17h17M8 15v-4m5 4V7m5 8v-5"/>',
  settings: '<path d="m10 3-1 3-3 1-3 3 2 3 1 4 4 1 3 3 3-2 4-1 1-4 2-3-3-3-1-3-4-1Z"/><circle cx="12" cy="12" r="3"/>',
  leaf: '<path d="M20 3C8 2 2 8 6 16c8 4 14-2 14-13ZM5 21 16 8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>', chevron: '<path d="m9 5 7 7-7 7"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 5h2m4 0h2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
  moon: '<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z"/>', book: '<path d="M12 6C8 3 4 4 2 5v14c3-2 7-1 10 1 3-2 7-3 10-1V5c-3-1-6-2-10 1Zm0 0v14"/>',
  check: '<path d="m5 12 4 4L19 6"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  shield: '<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Z"/><path d="m8 12 3 3 5-6"/>', note: '<path d="M14 3H5v18h14V8Z"/><path d="M14 3v5h5M8 12h8m-8 4h5"/>',
  up: '<path d="M12 19V5m-6 6 6-6 6 6"/>', down: '<path d="M12 5v14m-6-6 6 6 6-6"/>', edit: '<path d="m15 4 5 5-11 11H4v-5ZM13 6l5 5"/>', trash: '<path d="M3 6h18M9 6V3h6v3m-10 0 1 15h12l1-15M10 10v7m4-7v7"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>', download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>', upload: '<path d="M12 15V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  logout: '<path d="M9 4H4v16h5m3-8h9m-4-4 4 4-4 4"/>', dots: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>', sparkle: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',
};
export const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.leaf}</svg>`;
