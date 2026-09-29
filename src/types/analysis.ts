import type { LookId } from '../data/looks';
import type { SeasonId } from '../data/seasons';

export type FaceShape = 'Oval' | 'Round' | 'Square' | 'Heart' | 'Diamond' | 'Oblong' | 'Triangle';
export type Confidence = 'high' | 'medium' | 'low';

// Mirrors the tool schema in server/src/schema.js.
export type FaceAnalysis = {
  image_quality: { usable: boolean; issues: string[] };
  face_shape: { value: FaceShape; confidence: Confidence; note: string };
  features: {
    eye_shape: string;
    brow_shape: string;
    lip_shape: string;
    nose: string;
    cheekbones: string;
    jawline: string;
  };
  color: {
    undertone: 'Warm' | 'Cool' | 'Neutral' | 'Olive';
    depth: 'Light' | 'Medium' | 'Tan' | 'Deep';
    contrast: 'Low' | 'Medium' | 'High';
    season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
    sub_season: string;
    best_colors_hex: string[];
    avoid_colors_hex: string[];
    best_metal: 'Gold' | 'Silver' | 'Rose Gold';
    confidence: Confidence;
  };
  skin: {
    apparent_type: 'Oily' | 'Dry' | 'Combination' | 'Normal' | 'Unclear';
    strengths: string[];
    notes: string[];
  };
  makeup: {
    base: string;
    cheeks: string;
    eyes: string;
    brows: string;
    lips: string;
  };
  recommended_look: Exclude<LookId, 'choose-for-me'>;
  compliment: string;
};

export type ScanRecord = {
  id: string;
  timestamp: string; // ISO
  photoUri?: string;
  seasonId: SeasonId;
  lookId: LookId;
  shineScore: number;
  analysis: FaceAnalysis;
  source: 'ai' | 'demo';
};
