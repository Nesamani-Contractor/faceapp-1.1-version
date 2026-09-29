// Noir Velvet — design direction 1b from the Shine Me redesign handoff.
// Dark, cinematic, champagne accents. Values are taken from the prototype CSS.

export const noir = {
  bg: '#141010',
  bgDeep: '#0D0A0A',
  sheet: '#1A1414',
  surface: 'rgba(246,239,227,0.04)',
  stripeA: '#241C1A',
  stripeB: '#2E2320',

  ivory: '#F6EFE3',
  ivory80: 'rgba(246,239,227,0.8)',
  ivory66: 'rgba(246,239,227,0.66)',
  ivory62: 'rgba(246,239,227,0.62)',
  ivory60: 'rgba(246,239,227,0.6)',
  ivory52: 'rgba(246,239,227,0.52)',
  ivory42: 'rgba(246,239,227,0.42)',
  ivory24: 'rgba(246,239,227,0.24)',
  ivory22: 'rgba(246,239,227,0.22)',
  ivory16: 'rgba(246,239,227,0.16)',
  ivory10: 'rgba(246,239,227,0.1)',
  cream50: 'rgba(240,226,204,0.5)',
  cream35: 'rgba(240,226,204,0.35)',
  cream22: 'rgba(240,226,204,0.22)',

  gold: '#C9A262',
  goldLight: '#E2C88E',
  goldDeep: '#A67C3C',
  goldText: '#E6D3AE',
  gold45: 'rgba(201,162,98,0.45)',
  gold40: 'rgba(201,162,98,0.4)',
  gold35: 'rgba(201,162,98,0.35)',
  gold28: 'rgba(201,162,98,0.28)',
  gold22: 'rgba(201,162,98,0.22)',
  gold16: 'rgba(201,162,98,0.16)',
  gold12: 'rgba(201,162,98,0.12)',
  gold02: 'rgba(201,162,98,0.02)',

  ink: '#1B1512',
  scrim: 'rgba(10,8,8,0.6)',
  tabBar: 'rgba(20,16,16,0.86)',
  success: '#9BC59D',
  danger: '#D98A8A',
};

export const gradients = {
  goldCta: ['#C9A262', '#E2C88E', '#A67C3C'] as const,
  goldCtaStops: [0, 0.55, 1] as const,
  goldPill: ['#C9A262', '#E2C88E'] as const,
  heroFade: ['rgba(20,16,16,0.1)', 'rgba(20,16,16,0.1)', '#141010'] as const,
  heroFadeStops: [0, 0.4, 0.97] as const,
  cardFade: ['rgba(14,10,10,0)', 'rgba(14,10,10,0)', 'rgba(14,10,10,0.86)'] as const,
  cardFadeStops: [0, 0.4, 1] as const,
  goldWash: ['rgba(201,162,98,0.12)', 'rgba(201,162,98,0.02)'] as const,
  sweep: ['rgba(201,162,98,0)', 'rgba(201,162,98,0.45)'] as const,
  stripes: ['#241C1A', '#2E2320'] as const,
};

// Font keys registered in App.tsx.
export const fonts = {
  display: 'PlayfairDisplay_400Regular',
  displayMedium: 'PlayfairDisplay_500Medium',
  displaySemi: 'PlayfairDisplay_600SemiBold',
  displayItalic: 'PlayfairDisplay_400Regular_Italic',
  displayItalicMedium: 'PlayfairDisplay_500Medium_Italic',
  light: 'Jost_300Light',
  body: 'Jost_400Regular',
  medium: 'Jost_500Medium',
  semi: 'Jost_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
};

export const space = { gutter: 20, sm: 8, md: 14, lg: 22, xl: 32 };

export const radii = { chip: 99, card: 18, sheet: 30, swatch: 12 };

// CSS letter-spacing is in em; React Native wants points.
export const track = (em: number, fontSize: number) => em * fontSize;

export const TAB_BAR_HEIGHT = 82;
