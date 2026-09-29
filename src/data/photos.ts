// Editorial portrait photography, hot-linked from the Unsplash CDN.
//
// Licence: every photo below is published under the Unsplash License
// (https://unsplash.com/license) — free for commercial and non-commercial use,
// no permission or attribution required. Unsplash+ images are NOT used.
// Hot-linking images.unsplash.com is what the Unsplash API guidelines ask for.
//
// Each photo renders over its gradient fallback (see <Photo />), so if a URL
// is ever removed the card still shows the prototype's gradient.
// See PHOTO_CREDITS.md for the full list and how to swap in your own shoot.

export type PhotoKey =
  | 'hero'
  | 'welcome'
  | 'welcomeAlt1'
  | 'welcomeAlt2'
  | 'faceReader'
  | 'colourSeason'
  | 'makeupMatch'
  | 'soft-girl'
  | 'natural-glam'
  | 'soft-grunge'
  | 'latina-bestie'
  | 'full-glam'
  | 'sweet-spicy'
  | 'choose-for-me'
  | 'warm-spring'
  | 'cool-summer'
  | 'deep-autumn'
  | 'clear-winter'
  | 'paywall';

const unsplash = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const PHOTO_IDS: Record<PhotoKey, string> = {
  hero: '1524504388940-b1c1722653e1',
  welcome: '1529626455594-4ff0802cfb7e',
  welcomeAlt1: '1531746020798-e6953c6e8e04',
  welcomeAlt2: '1531123897727-8f129e1688ce',
  faceReader: '1534528741775-53994a69daeb',
  colourSeason: '1488426862026-3ee34a7d66df',
  makeupMatch: '1487412720507-e7ab37603c6f',
  'soft-girl': '1502823403499-6ccfcf4fb453',
  'natural-glam': '1494790108377-be9c29b29330',
  'soft-grunge': '1509967419530-da38b4704bc6',
  'latina-bestie': '1544005313-94ddf0286df2',
  'full-glam': '1529626455594-4ff0802cfb7e',
  'sweet-spicy': '1517841905240-472988babdf9',
  'choose-for-me': '1438761681033-6461ffad8d80',
  'warm-spring': '1508214751196-bcfd4ca60f91',
  'cool-summer': '1580489944761-15a19d654956',
  'deep-autumn': '1531123897727-8f129e1688ce',
  'clear-winter': '1534528741775-53994a69daeb',
  paywall: '1531746020798-e6953c6e8e04',
};

export const photoUri = (key: PhotoKey, width = 900) => unsplash(PHOTO_IDS[key], width);
