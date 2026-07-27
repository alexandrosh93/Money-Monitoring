const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const IconHome = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 9.5V20h13V9.5" />
    <path d="M10 20v-6h4v6" />
  </svg>
);

export const IconList = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <path d="M3 6h.01M3 12h.01M3 18h.01" strokeWidth={2.6} />
  </svg>
);

export const IconWallet = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h11A2.5 2.5 0 0 1 19 7.5V8H5.5A2.5 2.5 0 0 1 3 5.5" />
    <rect x="3" y="8" width="18" height="11" rx="2" />
    <circle cx="16" cy="13.5" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const IconTag = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M11.5 4h-6A1.5 1.5 0 0 0 4 5.5v6c0 .4.16.78.44 1.06l8 8a1.5 1.5 0 0 0 2.12 0l6-6a1.5 1.5 0 0 0 0-2.12l-8-8A1.5 1.5 0 0 0 11.5 4Z" />
    <circle cx="8.5" cy="8.5" r="1.25" fill="currentColor" stroke="none" />
  </svg>
);

export const IconSwap = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M4 8h13M17 8l-3.5-3.5M17 8l-3.5 3.5" />
    <path d="M20 16H7M7 16l3.5-3.5M7 16l3.5 3.5" />
  </svg>
);

export const IconPlus = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2.2}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconTrash = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M4 7h16" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7l1 13a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5l1-13" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const IconClose = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2.2}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconArrowUp = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2.2}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

export const IconArrowDown = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2.2}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);

export const IconEuro = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2}>
    <path d="M18 6.5a6.5 6.5 0 1 0 0 11" />
    <path d="M4 10h11M4 14h9" />
  </svg>
);

export const IconChevronRight = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2.2}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const IconCash = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 9v.01M18 15v.01" strokeWidth={2.6} />
  </svg>
);

export const IconBank = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M3 10 12 4l9 6" />
    <path d="M4.5 10v9M9.5 10v9M14.5 10v9M19.5 10v9" />
    <path d="M2.5 21h19" />
  </svg>
);

export const IconDownload = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M12 4v11M7 10l5 5 5-5" />
    <path d="M4 18v1.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V18" />
  </svg>
);

export const IconEmpty = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18" />
    <circle cx="12" cy="14.5" r="2" />
  </svg>
);
