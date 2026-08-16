
# Asha — frontend

React + Vite + Tailwind + Supabase + Groq (Qwen).

## Run it

```bash
npm install
npm run dev
```

`npm run dev` runs both the app and its `/api/*` routes locally (see `vite.config.js`'s `apiDevMiddleware`) — no separate backend process, no `vercel dev` needed.

## Environment variables

Set these in Vercel → Project → Settings → Environment Variables (and in a local `.env` for `npm run dev`):

| Variable                      | Used by                    | Notes                                                                                                                                                                                                                                                          |
| ----------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`         | client + server            | Your Supabase project URL. Not secret — safe to expose to the browser.                                                                                                                                                                                        |
| `VITE_SUPABASE_ANON_KEY`    | client                     | Public anon key.                                                                                                                                                                                                                                               |
| `SUPABASE_SERVICE_ROLE_KEY` | server only (`api/*`)    | **Never** prefix this with `VITE_` — it must never reach the browser.                                                                                                                                                                                 |
| `GROQ_API_KEY`              | server only (`api/ai/*`) | From[console.groq.com/keys](https://console.groq.com/keys).                                                                                                                                                                                                       |
| `GROQ_MODEL`                | server only (`api/ai/*`) | Optional. Defaults to `qwen/qwen3.6-27b` — multimodal (text + image input), which is why image attachments work. Check [console.groq.com/docs/models](https://console.groq.com/docs/models) before switching; Groq's lineup (and deprecation list) moves fast. |
| `VITE_API_BASE_URL`         | client                     | Leave**blank for local dev** so requests stay relative and hit your local server. Only set this (to your deployed API's origin) if you deliberately want a local frontend calling a remote backend.                                                      |

You do **not** need a separate `SUPABASE_URL` — the server routes fall back to `VITE_SUPABASE_URL` (see `api/_lib/supabaseAdmin.js`).

### A note on `.env` files and local dev

Vite loads `.env`, then `.env.local` (which wins on any overlapping key), and only reads them **once at server startup** — editing either file requires restarting `npm run dev` to take effect. If chat requests are failing locally, check `VITE_API_BASE_URL` first: if it's non-empty and pointing at a deployed URL, your production CORS allowlist (`api/_lib/cors.js`) will likely reject requests from `localhost`.

### Keeping keys out of git

`env.md` (if you're using one as a working reference) and `.env`/`.env.local` should never be committed — see `.gitignore`. The service-role key in particular bypasses every RLS policy in the database, so treat it like a master password: if it's ever been in a public or shared file, rotate it.

## Database

Run `supabase/schema.sql` in Supabase → SQL Editor. It sets up `profiles`, `chats`, `messages`, `surveys`, `questions`, `responses`, RLS policies, a trigger that auto-creates a `profiles` row on sign-up, and (added for the data-analysis feature) `attachment_name` / `attachment_type` / `attachment_summary` columns on `messages`.

> If you already ran an older copy of this file where the `questions` table had a `position` column instead of `order_index`, run the one-line migration comment at the bottom of that section in `schema.sql` instead of re-running the whole file.

## Storage

A private Supabase Storage bucket named **`documents`** holds chat attachments (spreadsheets and images), uploaded to `<user_id>/<filename>` so each user only reaches their own files (enforced by a storage RLS policy, also in `schema.sql`). Create the bucket in Dashboard → Storage with "Public bucket" **unchecked**, then run the accompanying policy SQL.

## Theming

Dark is the default; Settings → Theme → Light adds `.light` to `<html>`. Colors are CSS variables (`--color-canvas`, `--color-panel`, `--color-ink`, etc. — defined in `src/index.css`) surfaced as Tailwind tokens (`bg-canvas`, `text-ink`, `border-line`, `bg-btn`, …) in `tailwind.config.js`. Every page except `Login.jsx` uses these tokens, so they repaint automatically when the theme changes.

`Login.jsx` intentionally stays hardcoded dark (`bg-base-950` etc., a separate static palette also defined in `tailwind.config.js`) — its hero side is a photo backdrop, so it's styled to always look the same regardless of the in-app theme, the way most products keep their marketing/auth surface on-brand while the app interior is themeable.

**If you add a new page or component:** use the semantic tokens (`canvas`/`panel`/`panel2`/`panel3`/`line`/`line2`/`ink`/`btn`+`btn-foreground`), not literal `white`/`black`/`base-*`, or it won't respond to the theme toggle.

## Structure

- `src/lib/services/authService.js` — Supabase Auth + Google OAuth
- `src/lib/services/dbService.js` — all chat/survey/message/response queries, including attachment fields on messages
- `src/lib/services/aiService.js` — calls `/api/ai/*` (auth-gated serverless functions that hold the Groq key server-side)
- `src/lib/services/storageService.js` — uploads chat attachments to the private `documents` bucket and generates signed URLs for reading them back
- `src/lib/surveyInsights.js` — turns raw survey response rows into a per-question breakdown, used by both the Responses tab and as the context sent to the AI when a survey is referenced in chat
- `src/lib/documentInsights.js` — parses an uploaded CSV/Excel file client-side (via `papaparse`/`xlsx`) into a compact text summary (columns, per-column stats, sample rows) for the AI — same role `surveyInsights.js` plays for surveys
- `src/components/AttachmentPreview.jsx` — the file/image chip shown in the composer and on sent messages
- `src/components/ChatChart.jsx` — renders `chart` blocks from an AI reply (bar/line/pie)
- `src/components/MarkdownText.jsx` — renders `text` blocks from an AI reply
- `src/components/SurveyPickerModal.jsx` — the modal opened from the composer's "+" menu to attach an existing survey to a message
- `api/_lib/` — shared server helpers (`verifyUser`, `supabaseAdmin`, `groq`, `cors`, `errors`)
- `api/ai/` — one route per AI task: `chat`, `generate-title`, `generate-survey`, `generate-planning-questions`, `analyze-image` — all backed by Groq
- `api/delete-account.js` — service-role account deletion

## Attaching things in chat

The composer's **"+"** button opens a menu with three options:

- **Document** (CSV/Excel) — parsed entirely client-side (`documentInsights.js`); no AI call needed just to read it. The resulting summary (columns, stats, sample rows) is what gets sent to Asha, not the raw file — keeps requests small and gives the model something it can actually reason over.
- **Picture** — uploaded to Storage, then immediately sent through `api/ai/analyze-image.js`, a one-shot Groq vision call that describes what's in the image (chart values, screenshot text, whatever's visible) and returns a plain-text summary. That summary lands in the exact same field the spreadsheet summary uses, so the main chat prompt (`api/ai/chat.js`) doesn't need to know or care which kind of attachment produced it.
- **Survey** — opens `SurveyPickerModal` to pick from your existing surveys. Asha gets the survey's questions *and* an aggregated summary of its responses (per-question counts/percentages for choice questions, a sample of open-text answers) — not the raw response rows — so it can give grounded, plain-English insights instead of guessing.

In every case, the rule Asha's prompt enforces is the same: ground every claim in the actual data/summary given, and say plainly when something isn't answerable from it rather than inventing numbers.

## AI response format

`api/ai/chat.js` asks Groq for a JSON array of **blocks** rather than a single string:

- `{ "type": "text", "content": string }`
- `{ "type": "chart", "chart": { "kind": "bar" | "line" | "pie", ... } }`

Charts only appear when real attached/referenced data is available, and only when they'd genuinely clarify something over a sentence — the prompt explicitly withholds charts otherwise. If Groq's JSON output fails validation on a chart-heavy reply, `chat.js` retries once in a plain-text-only mode rather than surfacing a raw API error.

## Fixed in this pass (data-analysis feature)

- Added document/image attachments to chat, per the section above.
- **Model switched from `llama-3.3-70b-versatile` to `qwen/qwen3.6-27b`** — the former is on Groq's deprecation list, and the latter's multimodal support (text + image) means one model serves both plain chat and image analysis instead of juggling two.
- Asha's core prompt repositioned from "survey builder" to "gather and analyse data" more broadly — survey building is now one path among others (suggested when the user needs to *collect* new data), not the sole premise.
- Local dev: documented the `.env`/`.env.local` precedence and restart-on-change gotchas that came up repeatedly while wiring this feature — see the environment variables section above.
- `env.md` (or equivalent) and `.env*` added to `.gitignore` — they'd previously had no protection against being committed.

## Fixed in the earlier audit pass

- **AI provider switched from Gemini to Groq** — see `api/_lib/groq.js` and `api/ai/*`. Groq's inference is substantially faster, which was a big part of the app feeling slow.
- `api/gemini/chat.js` (now `api/ai/chat.js`) had a corrupted prompt — it referenced an undefined `topic` variable left over from a copy/paste of the planning-questions route, and mixed two unrelated prompts together. This threw on every single chat message.
- `supabase/schema.sql`'s `questions` table had a column named `position`, but every query in `dbService.js` asked for `order_index` — meaning survey creation, survey detail, and the public survey page were all failing against Supabase. Renamed the column to `order_index` to match.
- The old Gemini model name (`gemini-3.5-flash`) didn't exist and would 404 on every call — moot now that the provider's switched, but worth knowing if you ever roll back.
- **Responses tab** (`SurveyDetail.jsx`) only showed a bare submission timestamp before. It now shows a Google-Forms-style per-question breakdown (bars/percentages for choice questions, samples for open text) plus each individual response's full set of answers.
- **Survey preview**: added an eye-icon "Preview" button on the survey detail page that renders the survey exactly as a respondent would see it (shared UI with the public page), so you can check a draft before publishing — Google Forms-style.
- **Embed code**: added a "Copy code" button next to the shareable link that copies an `<iframe>` snippet for embedding the survey elsewhere.
- **Mobile sidebar**: rebuilt as a proper overlay drawer on small screens (slides in over the chat with a backdrop, closes on navigation or backdrop tap) instead of squeezing the chat's width. Desktop's collapse-to-icons behavior is unchanged.
- The Copy button on AI chat messages had no click handler — now copies the message text with a brief confirmation checkmark.
- `dbService.js` was still the localStorage mock in production — nothing was actually reaching Supabase. Swapped for the real implementation.
- `api/_lib/supabaseAdmin.js` read `SUPABASE_URL` instead of `VITE_SUPABASE_URL`, so every server route was failing. Falls back to `VITE_SUPABASE_URL` now.
- `Chat.jsx`'s `handlePlanningComplete()` discarded the planning-modal answers and only ever used the first chat message as survey context — this is why surveys came out generic. It now uses the full conversation + the planning answers.
- Error handling around AI calls in `Chat.jsx` — a failed request left the UI stuck on the typing indicator forever with no feedback. Added try/catch/finally and an inline error banner.
- Theme toggle had no CSS backing it at all. Rebuilt theming on CSS variables (see above).
- Sidebar had no delete-chat control despite `dbService.deleteChat()` already existing. Added a hover-revealed delete button per chat row.
- Profile picture: added `referrerPolicy="no-referrer"` (Google avatar URLs commonly 403 without it) plus an `onError` fallback to the default icon instead of a broken image.

## Known limits

Groq's free/dev tier enforces both per-minute and per-day token caps. A single message can now trigger up to three Groq calls (title generation, the main chat/blocks reply, and — if an image was attached — vision analysis), so token usage adds up faster than it did pre-attachments. If you start seeing "Asha had trouble putting that response together," check your usage in the GroqCloud dashboard before assuming it's a code bug; `maxTokens` in `api/_lib/groq.js` (4096 for chat, 1536 for image analysis) is the first thing to turn down if you need more headroom.

## Deploying

`vercel.json` already has the SPA rewrite so client-side routes survive a refresh.

# Latest Changes

Check the Chat.jsx file (line 423) and the Settings.jsx file (Line 79 - 102), I commented out the payment gate way trigger, when the payment gate way is fully active just uncomment it and change the neccessary API keys in the .env.local file
