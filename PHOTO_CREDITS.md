# Photo credits & licence

All portrait photography in the app is loaded at runtime from the Unsplash CDN
(`images.unsplash.com`). Every image is a free Unsplash photo published under the
[Unsplash License](https://unsplash.com/license):

- free to use for commercial and non-commercial purposes
- no permission needed, attribution appreciated but not required
- you may not sell unaltered copies or compile them into a competing stock service

No Unsplash+ (paid) images are used. The IDs live in `src/data/photos.ts`.

| Slot | Unsplash photo ID | CDN URL |
| --- | --- | --- |
| hero | 1524504388940-b1c1722653e1 | https://images.unsplash.com/photo-1524504388940-b1c1722653e1 |
| welcome | 1529626455594-4ff0802cfb7e | https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e |
| welcomeAlt1 | 1531746020798-e6953c6e8e04 | https://images.unsplash.com/photo-1531746020798-e6953c6e8e04 |
| welcomeAlt2 | 1531123897727-8f129e1688ce | https://images.unsplash.com/photo-1531123897727-8f129e1688ce |
| faceReader | 1534528741775-53994a69daeb | https://images.unsplash.com/photo-1534528741775-53994a69daeb |
| colourSeason | 1488426862026-3ee34a7d66df | https://images.unsplash.com/photo-1488426862026-3ee34a7d66df |
| makeupMatch | 1487412720507-e7ab37603c6f | https://images.unsplash.com/photo-1487412720507-e7ab37603c6f |
| soft-girl | 1502823403499-6ccfcf4fb453 | https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453 |
| natural-glam | 1494790108377-be9c29b29330 | https://images.unsplash.com/photo-1494790108377-be9c29b29330 |
| soft-grunge | 1509967419530-da38b4704bc6 | https://images.unsplash.com/photo-1509967419530-da38b4704bc6 |
| latina-bestie | 1544005313-94ddf0286df2 | https://images.unsplash.com/photo-1544005313-94ddf0286df2 |
| full-glam | 1529626455594-4ff0802cfb7e | https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e |
| sweet-spicy | 1517841905240-472988babdf9 | https://images.unsplash.com/photo-1517841905240-472988babdf9 |
| choose-for-me | 1438761681033-6461ffad8d80 | https://images.unsplash.com/photo-1438761681033-6461ffad8d80 |
| warm-spring | 1508214751196-bcfd4ca60f91 | https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91 |
| cool-summer | 1580489944761-15a19d654956 | https://images.unsplash.com/photo-1580489944761-15a19d654956 |
| deep-autumn | 1531123897727-8f129e1688ce | https://images.unsplash.com/photo-1531123897727-8f129e1688ce |
| clear-winter | 1534528741775-53994a69daeb | https://images.unsplash.com/photo-1534528741775-53994a69daeb |
| paywall | 1531746020798-e6953c6e8e04 | https://images.unsplash.com/photo-1531746020798-e6953c6e8e04 |

## Before you ship

These photos were chosen from Unsplash's catalogue without being checked in a
browser from this build environment (network access to Unsplash was blocked
there). Before release:

1. Open the app and confirm each slot shows a suitable portrait.
2. Swap any you don't like by replacing its ID in `src/data/photos.ts`.
3. For a production app, a commissioned shoot or licensed stock with model
   releases is recommended — Unsplash photos carry no model/property releases,
   so avoid implying the people pictured endorse Shine Me.

Every `<Photo />` renders over the prototype's gradient, so a missing image
degrades gracefully instead of leaving a blank card.
