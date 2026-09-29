import { lookForSeason, PICKABLE_LOOKS } from '../data/looks';
import { seasonForFamily, SEASONS } from '../data/seasons';
import { PRAISE } from '../data/copy';
import type { FaceAnalysis, ScanRecord } from '../types/analysis';

// Set EXPO_PUBLIC_API_URL (e.g. http://192.168.1.23:4000) to use the Claude
// vision backend in /server. Without it, the app runs a local demo reading so
// every screen still works offline.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export class ScanError extends Error {}

const hash = (s: string) => {
  let h = 2166136261;
  // Sample the string so multi-megabyte base64 stays cheap to hash.
  const step = Math.max(1, Math.floor(s.length / 4000));
  for (let i = 0; i < s.length; i += step) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const pick = <T,>(arr: readonly T[], seed: number, salt: number) => arr[(seed >>> salt) % arr.length];

export const demoAnalysis = (seedSource: string): FaceAnalysis => {
  const seed = hash(seedSource || String(Date.now()));
  const season = SEASONS[seed % SEASONS.length];
  const warm = season.family === 'Spring' || season.family === 'Autumn';
  return {
    image_quality: { usable: true, issues: [] },
    face_shape: {
      value: pick(['Oval', 'Heart', 'Round', 'Diamond', 'Oblong', 'Square'] as const, seed, 3),
      confidence: 'medium',
      note: 'Balanced proportions that carry most looks well.',
    },
    features: {
      eye_shape: pick(['Almond', 'Round', 'Hooded', 'Upturned'], seed, 5),
      brow_shape: pick(['Softly arched', 'Straight', 'High arch'], seed, 7),
      lip_shape: pick(['Full & defined', 'Heart-shaped', 'Balanced'], seed, 9),
      nose: pick(['Straight', 'Button', 'Softly rounded'], seed, 11),
      cheekbones: pick(['High', 'Soft', 'Defined'], seed, 13),
      jawline: pick(['Soft', 'Tapered', 'Defined'], seed, 15),
    },
    color: {
      undertone: warm ? 'Warm' : 'Cool',
      depth: pick(['Light', 'Medium', 'Tan', 'Deep'] as const, seed, 17),
      contrast: season.family === 'Winter' ? 'High' : season.family === 'Summer' ? 'Low' : 'Medium',
      season: season.family,
      sub_season: season.name.split(' ')[0],
      best_colors_hex: season.palette,
      avoid_colors_hex: season.avoid,
      best_metal: season.metal,
      confidence: 'medium',
    },
    skin: {
      apparent_type: pick(['Combination', 'Normal', 'Dry', 'Oily'] as const, seed, 19),
      strengths: ['Even tone', 'Healthy glow'],
      notes: ['A little shine through the T-zone — a blotting sheet at midday keeps it fresh.'],
    },
    makeup: {
      base: 'A sheer, skin-like base lets your best features shine through.',
      cheeks: warm ? 'Peach or apricot cream blush, tapped high.' : 'Cool rose blush blended toward the temples.',
      eyes: warm ? 'Bronze and champagne shimmer to echo your warmth.' : 'Taupe and plum with a pearl inner corner.',
      brows: 'Brush up and set with tinted gel for soft definition.',
      lips: warm ? 'Coral or warm nude with gloss.' : 'Berry or rosy mauve.',
    },
    recommended_look: lookForSeason(season.id) as FaceAnalysis['recommended_look'],
    compliment: PRAISE[seed % PRAISE.length],
  };
};

const withTimeout = async (url: string, init: RequestInit, ms: number) => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
};

export const analyzeFace = async (
  imageBase64: string,
  mediaType = 'image/jpeg'
): Promise<{ analysis: FaceAnalysis; source: 'ai' | 'demo' }> => {
  if (!API_URL) {
    await new Promise((r) => setTimeout(r, 2600));
    return { analysis: demoAnalysis(imageBase64), source: 'demo' };
  }
  const res = await withTimeout(
    `${API_URL}/api/analyze`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mediaType }),
    },
    90_000
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ScanError(body.message ?? "We couldn't read that photo. Please try another.");
  const analysis = body.analysis as FaceAnalysis;
  if (!analysis.image_quality.usable) {
    throw new ScanError(
      analysis.image_quality.issues.length
        ? `We couldn't get a clear read: ${analysis.image_quality.issues.join(', ')}.`
        : "We couldn't get a clear read of your face. Try soft daylight, facing the camera."
    );
  }
  return { analysis, source: 'ai' };
};

// Shine Score reflects how clearly the scan read your features and colouring —
// not a rating of how someone looks. It is always framed positively.
const CONF_POINTS = { high: 4, medium: 2, low: 0 } as const;
export const shineScoreFor = (a: FaceAnalysis) =>
  88 + CONF_POINTS[a.face_shape.confidence] + CONF_POINTS[a.color.confidence] + Math.min(2, a.skin.strengths.length);

export const buildRecord = (
  analysis: FaceAnalysis,
  source: 'ai' | 'demo',
  photoUri?: string
): ScanRecord => {
  const season = seasonForFamily(analysis.color.season);
  const lookId = PICKABLE_LOOKS.some((l) => l.id === analysis.recommended_look)
    ? analysis.recommended_look
    : lookForSeason(season.id);
  return {
    id: `scan-${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    photoUri,
    seasonId: season.id,
    lookId,
    shineScore: shineScoreFor(analysis),
    analysis,
    source,
  };
};

// Makeup Match: the closest of the six looks to a reference photo.
export const matchLook = async (imageBase64: string) => {
  if (API_URL) {
    try {
      const res = await withTimeout(
        `${API_URL}/api/match`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64, mediaType: 'image/jpeg' }),
        },
        60_000
      );
      if (res.ok) {
        const body = await res.json();
        if (PICKABLE_LOOKS.some((l) => l.id === body.lookId)) return body as { lookId: string; reason: string };
      }
    } catch {
      // fall through to the demo match
    }
  }
  await new Promise((r) => setTimeout(r, 1400));
  const look = PICKABLE_LOOKS[hash(imageBase64) % PICKABLE_LOOKS.length];
  return { lookId: look.id, reason: `The palette and finish in your photo sit closest to ${look.title}.` };
};
