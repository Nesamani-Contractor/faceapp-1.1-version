// JSON schemas for Claude's structured output. Mirrors src/types/analysis.ts
// in the app. Structured outputs need `additionalProperties: false` and every
// property listed in `required`.

const str = { type: 'string' };
const conf = { type: 'string', enum: ['high', 'medium', 'low'] };
const hexList = { type: 'array', items: { type: 'string' } };

const obj = (properties) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

export const LOOK_IDS = ['full-glam', 'latina-bestie', 'soft-grunge', 'natural-glam', 'soft-girl', 'sweet-spicy'];

export const analysisSchema = obj({
  image_quality: obj({ usable: { type: 'boolean' }, issues: { type: 'array', items: str } }),
  face_shape: obj({
    value: { type: 'string', enum: ['Oval', 'Round', 'Square', 'Heart', 'Diamond', 'Oblong', 'Triangle'] },
    confidence: conf,
    note: str,
  }),
  features: obj({
    eye_shape: str,
    brow_shape: str,
    lip_shape: str,
    nose: str,
    cheekbones: str,
    jawline: str,
  }),
  color: obj({
    undertone: { type: 'string', enum: ['Warm', 'Cool', 'Neutral', 'Olive'] },
    depth: { type: 'string', enum: ['Light', 'Medium', 'Tan', 'Deep'] },
    contrast: { type: 'string', enum: ['Low', 'Medium', 'High'] },
    season: { type: 'string', enum: ['Spring', 'Summer', 'Autumn', 'Winter'] },
    sub_season: str,
    best_colors_hex: hexList,
    avoid_colors_hex: hexList,
    best_metal: { type: 'string', enum: ['Gold', 'Silver', 'Rose Gold'] },
    confidence: conf,
  }),
  skin: obj({
    apparent_type: { type: 'string', enum: ['Oily', 'Dry', 'Combination', 'Normal', 'Unclear'] },
    strengths: { type: 'array', items: str },
    notes: { type: 'array', items: str },
  }),
  makeup: obj({ base: str, cheeks: str, eyes: str, brows: str, lips: str }),
  recommended_look: { type: 'string', enum: LOOK_IDS },
  compliment: str,
});

export const matchSchema = obj({
  lookId: { type: 'string', enum: LOOK_IDS },
  reason: str,
});
