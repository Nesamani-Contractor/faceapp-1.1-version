export const BRAND = 'SHINE ME';
export const TAGLINE = 'Your face, your colours, your look — read in one scan.';

export const PRAISE: string[] = [
  'Your face is absolutely beautiful — that bone structure is a gift.',
  "Gorgeous doesn't even cover it. Your glow is radiant today.",
  'You have the kind of natural beauty that lights up a room.',
  'Stunning. Your features are so perfectly, uniquely you.',
  'Your smile alone could stop traffic — truly breathtaking.',
  'That skin, those eyes — you are glowing from the inside out.',
  'Simply exquisite. You were made to shine, gorgeous.',
  'Your symmetry and glow are giving certified goddess energy.',
];

export const SCAN_STEPS = [
  'Mapping your bone structure',
  'Measuring face shape',
  'Reading your undertone',
  'Finding your colour season',
  'Matching your look',
];

export const SCAN_TIPS: { text: string; ok: boolean }[] = [
  { text: 'Look straight at the camera', ok: true },
  { text: 'Face soft daylight, clear wall behind you', ok: true },
  { text: "Don't use filters", ok: false },
  { text: "Don't wear hats or glasses", ok: false },
  { text: "Don't cover your face", ok: false },
];

export const PREMIUM_FEATURES = [
  { icon: 'infinite-outline', label: 'Unlimited face & colour scans' },
  { icon: 'sparkles-outline', label: 'Full Shine Me guide & routines' },
  { icon: 'people-outline', label: 'Style-icon match' },
  { icon: 'pricetag-outline', label: 'Personalised product picks' },
  { icon: 'image-outline', label: 'Makeup Match from any photo' },
  { icon: 'color-wand-outline', label: 'All 7 looks unlocked' },
] as const;

export const PLANS = [
  { id: 'weekly', label: 'Weekly', price: '$6.99', period: '/week' },
  { id: 'yearly', label: 'Yearly', price: '$39.99', period: '/year', badge: 'Best value' },
] as const;

export const FREE_SCANS = 3;
