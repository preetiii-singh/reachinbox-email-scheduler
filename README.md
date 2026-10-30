# ReachInbox email scheduler

A TypeScript monorepo for reliably scheduling bulk outbound email. It uses Express, PostgreSQL, Redis/BullMQ, Elasticsearch, Ethereal SMTP, and React/Vite.

## Quick start

1. Copy `apps/api/.env.example` to `apps/api/.env` and fill OAuth/SMTP credentials. Create an Ethereal account at https://ethereal.email/create and use its SMTP values.
2. Run `docker compose up -d` (Postgres, Redis, Elasticsearch).
3. Run `npm install`, `npm run db:migrate`, and `npm run dev`.
4. Visit `http://localhost:5173`. The API is at `http://localhost:4000`; Bull Board is protected by API session auth at `/admin/queues`.

## Architecture

`POST /api/campaigns` writes a campaign and one `scheduled_emails` record per lead in one transaction, then adds delayed BullMQ jobs. The job ID is `email:<id>:<revision>`, so replays are deduplicated by Redis. The worker performs a conditional DB claim before SMTP and indexes every state change in Elasticsearch.

On worker startup, `rehydrateFutureJobs()` reads still-scheduled rows and restores any missing delayed jobs. BullMQ persists delayed jobs in Redis; PostgreSQL is the source of truth if Redis was also rebuilt. Sent rows are never requeued. This is deliberately not cron-based.

### Rate limiting, delay, and load

Concurrency (`WORKER_CONCURRENCY`), inter-email spacing (`MIN_SEND_DELAY_MS` or campaign setting), and the per-sender hourly limit are environment/configurable. Before a send, a Redis Lua script atomically reserves a slot in `sender:<id>:hour:<UTC hour>`. If full, the worker persists a new `scheduled_at` in the next hour and creates a newer revision job; it does not drop the email. A Redis sorted-set gate atomically assigns the next per-sender send slot, preserving order across workers as closely as practical. This remains correct with many processes because neither operation uses memory-local counters.

For 1,000 simultaneous requests, jobs remain delayed in Redis; the configured workers reserve ordered slots and overflow into future hourly windows. Elasticsearch is for dashboard search, not scheduling truth.

SMTP cannot provide transactional exactly-once delivery. We use a durable DB claim and deterministic Message-ID to make worker retries safe; a process crash after SMTP acceptance but before DB acknowledgement is documented as the unavoidable external-side-effect edge case, recoverable through the reconciliation endpoint/operational review.

### OAuth and Slack

Google OAuth uses Passport and stores the user/session in PostgreSQL. Slack's real OAuth v2 flow is started by **Connect Slack**; its bot token is encrypted-at-rest only when `TOKEN_ENCRYPTION_KEY` is configured and is used with `chat.postMessage` immediately when a sender first hits its limit in a window. Missing or revoked Slack connections are non-fatal.

## API highlights

- `POST /api/campaigns` — `{subject, body, recipients, startAt, delayMs, hourlyLimit, senderId}`
- `GET /api/emails?status=scheduled|sent|failed&q=...`
- `GET /api/emails/search?q=...` — Elasticsearch-backed
- `GET /auth/google`, `/auth/google/callback`, `/auth/logout`
- `GET /integrations/slack/connect`, `/integrations/slack/callback`, `DELETE /integrations/slack`

## Trade-offs / demo notes

Use a real Google client and Slack app redirect URL pointing at localhost for a live demo. The UI uses the authenticated Google account as its tenant. A separate worker process is normally recommended (`npm run worker`); `npm run dev` starts it with the API for convenience. Stop and restart it before a future send to demonstrate rehydration. Queue observability is Bull Board at `/admin/queues`.
