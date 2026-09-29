# Shine Me 1.1 — Noir Velvet

The Shine Me beauty app, rebuilt as an Expo (SDK 57) React Native app in design
direction **1b "Noir Velvet"** from the Claude Design handoff: dark, cinematic,
champagne accents, Playfair Display + Jost + JetBrains Mono.

## Features

| Feature | Where |
| --- | --- |
| Scan home (1b): full-bleed portrait hero, "SCAN MY FACE" CTA, service chips, *Seven looks* rail, last-scan card | `src/screens/HomeScreen.tsx` |
| Face Reader camera — arch face frame, do's & don'ts sheet, front/back flip, pick from library | `src/screens/CameraScreen.tsx` |
| Analysing — 1b arch scan with sweep, rotating steps, progress % | `src/screens/AnalyzingScreen.tsx` |
| **Facial analysis** — face shape, eyes, brows, lips, nose, cheekbones, jawline | `src/screens/ResultsScreen.tsx` |
| **Colour analysis** — season, undertone/depth/contrast, colours to wear & avoid, best metal | `src/screens/ResultsScreen.tsx` |
| Skin notes (cosmetic only) and a personalised 5-step **makeup guide** | `src/screens/ResultsScreen.tsx` |
| Seven looks lookbook, look detail with palette + how-to, *Choose For Me* | `LooksScreen.tsx`, `LookDetailScreen.tsx` |
| **Makeup Match** — upload any photo, get the closest look | `MakeupMatchScreen.tsx` |
| Four colour seasons explorer | `SeasonsScreen.tsx` |
| Vault — stats, saved looks, scan history | `VaultScreen.tsx` |
| Premium paywall ($6.99/week, $39.99/year), 3 free scans | `PaywallScreen.tsx` |
| Onboarding with style pick | `WelcomeScreen.tsx` |

Design tokens live in `src/theme/noir.ts`; every value comes from the 1b prototype CSS.

## Run the app

```bash
npm install
npx expo start          # press i / a / w, or scan the QR with Expo Go
```

Without a backend the app runs in **demo mode**: scans produce a sample reading
(clearly labelled on the results screen) so every screen can be reviewed.

## Real AI analysis (Claude)

`server/` is a small Express API that sends the photo to Claude
(`claude-opus-5-5`, vision + JSON-schema structured output) and returns the
facial, colour, skin and makeup reading.

```bash
cd server
npm install
cp .env.example .env    # add ANTHROPIC_API_KEY
npm start               # http://localhost:4000
```

Then point the app at it:

```bash
EXPO_PUBLIC_API_URL=http://<your-computer-LAN-IP>:4000 npx expo start
```

The server enables Anthropic's server-side refusal fallback (`fallbacks: "default"`),
so a safety-classifier decline is retried on the recommended fallback model.

## Photography

Portraits are licensed Unsplash photos (free for commercial use), hot-linked
from the Unsplash CDN — see [PHOTO_CREDITS.md](PHOTO_CREDITS.md). Swap any slot
in `src/data/photos.ts`.

## Not yet wired

- In-app purchases: the paywall unlocks premium locally. Connect StoreKit / Play Billing (e.g. RevenueCat) before release.
- The server has no auth or rate limiting; put it behind your own API gateway before exposing it publicly.
