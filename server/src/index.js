import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { Ajv } from 'ajv';
import { analysisSchema, matchSchema } from './schema.js';
import { ANALYSIS_SYSTEM, MATCH_SYSTEM } from './prompts.js';

const MODEL = process.env.SHINE_MODEL || 'claude-opus-5-5';
const PORT = Number(process.env.PORT) || 4000;
const MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const client = new Anthropic(); // ANTHROPIC_API_KEY (or an `ant auth login` profile)
const ajv = new Ajv({ allErrors: true });
const validateAnalysis = ajv.compile(analysisSchema);
const validateMatch = ajv.compile(matchSchema);

class UserFacingError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const HEX = /^#[0-9A-Fa-f]{6}$/;

// One vision call with a JSON-schema output format. Opus 5.5 rejects forced
// tool_choice, so structured outputs are the way to get guaranteed JSON.
async function askClaude({ system, imageBase64, mediaType, prompt, schema, validate, effort }) {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    // If a safety classifier declines, re-run on Anthropic's recommended fallback model.
    fallbacks: 'default',
    system,
    output_config: { effort, format: { type: 'json_schema', schema } },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });

  if (response.stop_reason === 'refusal') {
    throw new UserFacingError(422, "We couldn't analyse that photo. Please try a different, clear selfie.");
  }
  if (response.stop_reason === 'max_tokens') {
    throw new UserFacingError(502, 'The reading was cut short. Please try again.');
  }
  const text = response.content.find((b) => b.type === 'text')?.text;
  let parsed;
  try {
    parsed = JSON.parse(text ?? '');
  } catch {
    throw new UserFacingError(502, 'The AI returned an unreadable result. Please try again.');
  }
  if (!validate(parsed)) {
    console.error('[shine-me] schema validation failed', validate.errors);
    throw new UserFacingError(502, 'The AI returned an incomplete result. Please try again.');
  }
  return parsed;
}

const readImage = (body) => {
  const imageBase64 = typeof body?.imageBase64 === 'string' ? body.imageBase64.replace(/^data:[^,]+,/, '') : '';
  const mediaType = MEDIA_TYPES.has(body?.mediaType) ? body.mediaType : 'image/jpeg';
  if (imageBase64.length < 1000) throw new UserFacingError(400, 'No photo received.');
  return { imageBase64, mediaType };
};

const sendError = (res, err) => {
  if (err instanceof UserFacingError) return res.status(err.status).json({ message: err.message });
  if (err instanceof Anthropic.RateLimitError) {
    return res.status(429).json({ message: 'Shine Me is busy right now — try again in a moment.' });
  }
  if (err instanceof Anthropic.AuthenticationError) {
    console.error('[shine-me] Anthropic auth failed — check ANTHROPIC_API_KEY');
    return res.status(500).json({ message: 'The server is not configured correctly.' });
  }
  if (err instanceof Anthropic.BadRequestError) {
    console.error('[shine-me] bad request', err.message);
    return res.status(400).json({ message: "That photo couldn't be processed. Try a JPEG under 5 MB." });
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return res.status(503).json({ message: "Couldn't reach the AI service. Please try again." });
  }
  console.error('[shine-me] unexpected error', err);
  return res.status(500).json({ message: 'Something went wrong. Please try again.' });
};

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, model: MODEL }));

app.post('/api/analyze', async (req, res) => {
  try {
    const { imageBase64, mediaType } = readImage(req.body);
    const analysis = await askClaude({
      system: ANALYSIS_SYSTEM,
      imageBase64,
      mediaType,
      prompt: 'Read this selfie for Shine Me.',
      schema: analysisSchema,
      validate: validateAnalysis,
      effort: 'medium',
    });
    // Keep swatches renderable even if a colour comes back malformed.
    analysis.color.best_colors_hex = analysis.color.best_colors_hex.filter((h) => HEX.test(h)).slice(0, 6);
    analysis.color.avoid_colors_hex = analysis.color.avoid_colors_hex.filter((h) => HEX.test(h)).slice(0, 4);
    if (analysis.image_quality.usable && analysis.color.best_colors_hex.length < 3) {
      throw new UserFacingError(502, 'The colour reading was incomplete. Please try again.');
    }
    res.json({ analysis });
  } catch (err) {
    sendError(res, err);
  }
});

app.post('/api/match', async (req, res) => {
  try {
    const { imageBase64, mediaType } = readImage(req.body);
    const match = await askClaude({
      system: MATCH_SYSTEM,
      imageBase64,
      mediaType,
      prompt: 'Which Shine Me look is closest to the makeup in this photo?',
      schema: matchSchema,
      validate: validateMatch,
      effort: 'low',
    });
    res.json(match);
  } catch (err) {
    sendError(res, err);
  }
});

app.listen(PORT, () => {
  console.log(`[shine-me] listening on http://localhost:${PORT} (model ${MODEL})`);
});
