# Asha — frontend

React + Vite + Tailwind + Supabase + Groq (Llama).

## Run it

```bash
npm install
npm run dev
```

## Environment variables

Set these in Vercel → Project → Settings → Environment Variables (and in a local `.env` for `npm run dev`):

| Variable | Used by | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | client + server | Your Supabase project URL. Not secret — safe to expose to the browser. |
| `VITE_SUPABASE_ANON_KEY` | client | Public anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | server only (`api/*`) | **Never** prefix this with `VITE_` — it must never reach the browser. |
| `GROQ_API_KEY` | server only (`api/ai/*`) | From [console.groq.com/keys](https://console.groq.com/keys). |
| `GROQ_MODEL` | server only (`api/ai/*`) | Optional. Defaults to `llama-3.3-70b-versatile`. Set to e.g. `llama-3.1-8b-instant` for faster/cheaper replies. |

You do **not** need a separate `SUPABASE_URL` — the server routes fall back to `VITE_SUPABASE_URL` (see `api/_lib/supabaseAdmin.js`).

## Database

Run `supabase/schema.sql` in Supabase → SQL Editor. It sets up `profiles`, `chats`, `messages`, `surveys`, `questions`, `responses`, RLS policies, and a trigger that auto-creates a `profiles` row on sign-up.

> If you already ran an older copy of this file where the `questions` table had a `position` column instead of `order_index`, run the one-line migration comment at the bottom of that section in `schema.sql` instead of re-running the whole file.

## Theming

Dark is the default; Settings → Theme → Light adds `.light` to `<html>`. Colors are CSS variables (`--color-canvas`, `--color-panel`, `--color-ink`, etc. — defined in `src/index.css`) surfaced as Tailwind tokens (`bg-canvas`, `text-ink`, `border-line`, `bg-btn`, …) in `tailwind.config.js`. Every page except `Login.jsx` uses these tokens, so they repaint automatically when the theme changes.

`Login.jsx` intentionally stays hardcoded dark (`bg-base-950` etc., a separate static palette also defined in `tailwind.config.js`) — its hero side is a photo backdrop, so it's styled to always look the same regardless of the in-app theme, the way most products keep their marketing/auth surface on-brand while the app interior is themeable.

**If you add a new page or component:** use the semantic tokens (`canvas`/`panel`/`panel2`/`panel3`/`line`/`line2`/`ink`/`btn`+`btn-foreground`), not literal `white`/`black`/`base-*`, or it won't respond to the theme toggle.

## Structure

- `src/lib/services/authService.js` — Supabase Auth + Google OAuth
- `src/lib/services/dbService.js` — all chat/survey/message/response queries
- `src/lib/services/aiService.js` — calls `/api/ai/*` (auth-gated serverless functions that hold the Groq key server-side)
- `src/lib/surveyInsights.js` — turns raw response rows into a per-question breakdown, used by both the Responses tab and as the context sent to the AI when a survey is referenced in chat
- `api/_lib/` — shared server helpers (`verifyUser`, `supabaseAdmin`, `groq`)
- `api/ai/` — one route per AI task (`chat`, `generate-title`, `generate-survey`, `generate-planning-questions`), all backed by Groq's Llama models
- `api/delete-account.js` — service-role account deletion

## Public survey page

`src/pages/PublicSurvey.jsx`, mounted at `/s/:slug` — unauthenticated, only ever loads published surveys (enforced by RLS, not just client logic). It shares its question-rendering UI (`src/components/SurveyForm.jsx`) with the in-app "Preview" modal on the survey detail page, so a draft survey previews exactly the way it'll look once published.

## Referencing a survey in chat

Typing "+" in the composer lets you attach one of your surveys to a message. Asha then gets the survey's questions *and* an aggregated summary of its responses (per-question counts/percentages for choice questions, a sample of open-text answers) — not the raw response rows — so it can give grounded, plain-English insights and next-step suggestions instead of guessing.

## Fixed in this audit pass

- **AI provider switched from Gemini to Groq** (Llama 3.3 70B by default) — see `api/_lib/groq.js` and `api/ai/*`. Groq's inference is substantially faster, which was a big part of the app feeling slow.
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

## Deploying

`vercel.json` already has the SPA rewrite so client-side routes survive a refresh.
