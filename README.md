# SmartSlimWay

Primary repository for the SmartSlimWay website and its MAX bot.

## Structure

```text
.
├── src/         # React + TypeScript frontend
├── public/      # frontend media
├── max-bot/     # MAX webhook service deployed on Render
└── render.yaml  # Render blueprint; deploys max-bot/
```

## Commands

```bash
npm run dev        # website development server
npm run build      # production website build
npm run bot:check  # MAX bot syntax check
npm run bot:start  # run MAX bot from max-bot/
npm run check      # website build + bot check
```

Production website: `https://new-site-kappa-eight.vercel.app/smartslimway`

The existing MAX bot remains deployed from the legacy repository until Render is manually switched. Do not delete or disable the legacy deployment before the new monorepo deployment passes `/health` and webhook tests.
