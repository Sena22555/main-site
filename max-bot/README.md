# SmartSlimWay MAX bot

MAX webhook bot colocated with the primary SmartSlimWay frontend.

## Repository layout

```text
new-site/
├── src/                 # React/Vite website
├── public/              # Website assets
└── max-bot/             # MAX webhook service for Render
    ├── max-bot.js
    ├── package.json
    ├── render.yaml
    ├── certs/
    └── data/
```

The currently deployed legacy copy in the old `smartslimway-site` repository must remain online until Render is manually switched to this repository. Copying the service here does not modify the live webhook or stop the existing bot.

## Local checks

From the repository root:

```bash
npm run bot:check
```

Run the bot locally after supplying environment variables:

```bash
npm run bot:start
```

## Future Render switch

When ready to move the existing Render service:

1. Change its repository to `Sena22555/main-site`.
2. Set the Render root directory to `max-bot`.
3. Keep the existing environment secrets, especially `MAX_BOT_TOKEN` and `MAX_WEBHOOK_SECRET`.
4. Keep the existing public service URL so the webhook remains `https://smartslimway-max-bot.onrender.com/webhook`.
5. Deploy and verify `/health` before making any other changes.

The bot links to the primary website at `https://new-site-kappa-eight.vercel.app/smartslimway` and its application, calculator, reviews, about, program, FAQ, and contacts routes.

## Required environment variables

- `MAX_BOT_TOKEN`
- `MAX_WEBHOOK_SECRET`
- `ADMIN_SECRET`
- `MAX_API_BASE`
- `WEBHOOK_URL`
- `DAILY_SECRET` when `DAILY_SEND_ENABLED=true`
- optional daily-message settings from `.env.max-bot.example`

The webhook, daily-send, webhook-registration, and subscriber-count endpoints
require constant-time secret header authentication. Use `x-max-bot-api-secret`
for `/webhook`, `x-daily-secret` for `/send-daily`, and `x-admin-secret` for
`/register-webhook` and `/subscribers`. Registration always uses configured
`WEBHOOK_URL` and `MAX_WEBHOOK_SECRET`; request-provided URL and secret values
are ignored. `/subscribers` returns counts only.

Subscriber data is written atomically with file mode `0600`. Logs and external
error responses do not include request, API, or message payloads.

Never commit real tokens or secrets.
