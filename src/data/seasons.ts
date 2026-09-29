export type SeasonId = 'warm-spring' | 'cool-summer' | 'deep-autumn' | 'clear-winter';

export type ColourSeason = {
  id: SeasonId;
  family: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  name: string;
  subtitle: string;
  description: string;
  palette: string[];
  avoid: string[];
  metal: 'Gold' | 'Silver' | 'Rose Gold';
  keywords: string;
};

export const SEASONS: ColourSeason[] = [
  {
    id: 'warm-spring',
    family: 'Spring',
    name: 'Warm Spring',
    subtitle: 'Bright, warm & clear',
    description:
      'Your undertone glows with warmth. Fresh corals, warm peach and golden hues make your complexion light up.',
    palette: ['#FFB37B', '#FF8C69', '#F4C978', '#7FBF8E', '#F2E394'],
    avoid: ['#1E1B2E', '#5A5A6E', '#B7B7C9'],
    metal: 'Gold',
    keywords: 'coral, peach, honey',
  },
  {
    id: 'cool-summer',
    family: 'Summer',
    name: 'Cool Summer',
    subtitle: 'Soft, cool & muted',
    description:
      'Your colouring is soft and cool. Dusty rose, lavender and powder blue flatter your delicate undertone.',
    palette: ['#C9B7D4', '#9FB8CE', '#E3A9BE', '#B4C7B0', '#D8CFE0'],
    avoid: ['#FF8C1A', '#C97A3A', '#1B1512'],
    metal: 'Silver',
    keywords: 'rose, lavender, powder blue',
  },
  {
    id: 'deep-autumn',
    family: 'Autumn',
    name: 'Deep Autumn',
    subtitle: 'Rich, warm & deep',
    description:
      'You carry rich, earthy warmth beautifully. Terracotta, olive and deep amber bring out your natural richness.',
    palette: ['#A9542E', '#C97A3A', '#7A6B3A', '#8C3B2E', '#D9A94E'],
    avoid: ['#F7B8CE', '#9FB8CE', '#E8E8F0'],
    metal: 'Gold',
    keywords: 'terracotta, olive, amber',
  },
  {
    id: 'clear-winter',
    family: 'Winter',
    name: 'Clear Winter',
    subtitle: 'Bold, cool & vivid',
    description:
      'Your contrast is striking. Fuchsia, icy pink and jewel tones make your features pop with clarity.',
    palette: ['#C24A72', '#5A2340', '#3E7CB1', '#E8799F', '#1E1B2E'],
    avoid: ['#D9A94E', '#C97A3A', '#F2E394'],
    metal: 'Rose Gold',
    keywords: 'fuchsia, icy pink, jewel tones',
  },
];

export const getSeason = (id: string | undefined) => SEASONS.find((s) => s.id === id) ?? SEASONS[0];

export const seasonForFamily = (family: string) =>
  SEASONS.find((s) => s.family.toLowerCase() === family.toLowerCase()) ?? SEASONS[0];
