import type { SeasonId } from './seasons';

export type LookId =
  | 'full-glam'
  | 'latina-bestie'
  | 'soft-grunge'
  | 'natural-glam'
  | 'soft-girl'
  | 'sweet-spicy'
  | 'choose-for-me';

export type LookStep = { area: string; how: string };

export type Look = {
  id: LookId;
  title: string;
  vibe: string; // short "Bold · dramatic" card subtitle
  tagline: string;
  description: string;
  gradient: readonly [string, string, string];
  vibeWords: string[];
  palette: string[];
  steps: LookStep[];
};

// Order matches the "Seven looks" rail in design 1b.
export const LOOKS: Look[] = [
  {
    id: 'full-glam',
    title: 'Full Glam',
    vibe: 'Bold · dramatic',
    tagline: 'Bold & dramatic',
    description: 'A dramatic, all-out look with bold, attention-grabbing makeup fit for the spotlight.',
    gradient: ['#3A2440', '#7A2E52', '#C24A72'],
    vibeWords: ['Dramatic', 'Bold', 'Show-stopping'],
    palette: ['#3A2440', '#7A2E52', '#C24A72', '#E2C88E', '#1E1B2E'],
    steps: [
      { area: 'Base', how: 'Full-coverage matte foundation, set with a translucent powder.' },
      { area: 'Sculpt', how: 'Cool contour under the cheekbones, sharp highlight on the tops.' },
      { area: 'Eyes', how: 'Cut-crease in plum, champagne lid shimmer, winged liner and lashes.' },
      { area: 'Brows', how: 'Defined and brushed up, sealed with clear gel.' },
      { area: 'Lips', how: 'Overlined berry lip with a touch of gloss in the centre.' },
    ],
  },
  {
    id: 'latina-bestie',
    title: 'Latina Bestie',
    vibe: 'Spicy · fierce',
    tagline: 'Spicy, fierce, confident',
    description: 'A bold look that screams spicy, fierce and confident — sun-kissed glow with a fiery pop of colour.',
    gradient: ['#FFD6A5', '#F2745A', '#B8324B'],
    vibeWords: ['Spicy', 'Fierce', 'Confident'],
    palette: ['#FFD6A5', '#F2745A', '#B8324B', '#8C3B2E', '#D9A94E'],
    steps: [
      { area: 'Base', how: 'Satin foundation one shade warm, bronzer swept high on the face.' },
      { area: 'Cheeks', how: 'Terracotta blush blended into the bronzer.' },
      { area: 'Eyes', how: 'Warm brown smoke, bronze lid, flicked liner.' },
      { area: 'Brows', how: 'Full, feathered and laminated-looking.' },
      { area: 'Lips', how: 'Brown liner with a glossy nude-brick centre.' },
    ],
  },
  {
    id: 'soft-grunge',
    title: 'Soft Grunge',
    vibe: 'Edgy · moody',
    tagline: 'Edgy with a soft touch',
    description: 'An edgy, rebellious look with a soft touch — smoky eyes balanced with muted, moody tones.',
    gradient: ['#E3D3E8', '#B79BC4', '#6E4C7A'],
    vibeWords: ['Edgy', 'Moody', 'Rebellious'],
    palette: ['#E3D3E8', '#B79BC4', '#6E4C7A', '#3A2440', '#9C8C8C'],
    steps: [
      { area: 'Base', how: 'Light, skin-like base with a soft matte finish.' },
      { area: 'Cheeks', how: 'Barely-there mauve blush.' },
      { area: 'Eyes', how: 'Smudged charcoal liner, blown out with a violet-grey shadow.' },
      { area: 'Brows', how: 'Natural, brushed and slightly undone.' },
      { area: 'Lips', how: 'Blotted plum stain.' },
    ],
  },
  {
    id: 'natural-glam',
    title: 'Natural Glam',
    vibe: 'Recommended',
    tagline: 'Glowing & effortless',
    description: 'A glowing, effortless look that highlights your natural beauty with warm, radiant skin.',
    gradient: ['#FFF3E1', '#F6D9A8', '#D9A94E'],
    vibeWords: ['Glowing', 'Effortless', 'Radiant'],
    palette: ['#FFF3E1', '#F6D9A8', '#D9A94E', '#FFB37B', '#C97A3A'],
    steps: [
      { area: 'Base', how: 'Dewy skin tint, concealer only where you need it.' },
      { area: 'Cheeks', how: 'Peach cream blush tapped up toward the temples.' },
      { area: 'Eyes', how: 'Soft bronze wash, brown mascara.' },
      { area: 'Brows', how: 'Tinted gel, brushed up.' },
      { area: 'Lips', how: 'Warm nude balm with a hint of shimmer.' },
    ],
  },
  {
    id: 'soft-girl',
    title: 'Soft Girl',
    vibe: 'Dreamy · gentle',
    tagline: 'Delicate & dreamy',
    description: 'A delicate, dreamy look with gentle sweetness — dewy skin, blushed cheeks and soft rosy tones.',
    gradient: ['#FFE9F0', '#FFC9DE', '#F7A8C4'],
    vibeWords: ['Dreamy', 'Gentle', 'Sweet'],
    palette: ['#FFE9F0', '#FFC9DE', '#F7A8C4', '#E3A9BE', '#C9B7D4'],
    steps: [
      { area: 'Base', how: 'Hydrating primer and a sheer, glowy base.' },
      { area: 'Cheeks', how: 'Pink blush across the cheeks and nose bridge.' },
      { area: 'Eyes', how: 'Rosy lid, pearl inner corner, fluffy lashes.' },
      { area: 'Brows', how: 'Soft and feathery.' },
      { area: 'Lips', how: 'Blurred pink tint with clear gloss.' },
    ],
  },
  {
    id: 'sweet-spicy',
    title: 'Sweet & Spicy',
    vibe: 'Playful · vibrant',
    tagline: 'Playful & charming',
    description: 'A playful and charming look with vibrant touches — sweet at first glance with a spicy little kick.',
    gradient: ['#FFCB77', '#FF8FA3', '#C4467A'],
    vibeWords: ['Playful', 'Vibrant', 'Charming'],
    palette: ['#FFCB77', '#FF8FA3', '#C4467A', '#F4C978', '#E8799F'],
    steps: [
      { area: 'Base', how: 'Radiant skin with a strobed highlight.' },
      { area: 'Cheeks', how: 'Candy-pink blush, placed high.' },
      { area: 'Eyes', how: 'Pop of coral liner under a neutral lid.' },
      { area: 'Brows', how: 'Clean and groomed.' },
      { area: 'Lips', how: 'Juicy raspberry gloss.' },
    ],
  },
  {
    id: 'choose-for-me',
    title: 'Choose For Me',
    vibe: 'Let Shine Me decide',
    tagline: 'Let Shine Me decide',
    description:
      "Let's choose based on your picture — your Shine Me AI will pick the look that matches your features and colouring best.",
    gradient: ['#241C1A', '#A67C3C', '#E2C88E'],
    vibeWords: ['Curated', 'Personal', 'Surprise'],
    palette: ['#C9A262', '#E2C88E', '#A67C3C', '#F6EFE3', '#241C1A'],
    steps: [],
  },
];

export const getLook = (id: string | undefined) => LOOKS.find((l) => l.id === id);

export const PICKABLE_LOOKS = LOOKS.filter((l) => l.id !== 'choose-for-me');

const SEASON_TO_LOOK: Record<SeasonId, LookId> = {
  'warm-spring': 'natural-glam',
  'cool-summer': 'soft-girl',
  'deep-autumn': 'latina-bestie',
  'clear-winter': 'full-glam',
};

export const lookForSeason = (seasonId: SeasonId): LookId => SEASON_TO_LOOK[seasonId];
