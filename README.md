# OneEmployee CRM Frontend

React frontend for the OneEmployee lead generation and CRM platform. Deployed on Vercel.

**Live:** `https://www.oneemployee.in`  
**Repo:** `Home-In-Town/LeadGen_Frontend-HIT` (auto-deploys on push to `main`)

---

## Tech Stack

- **Framework:** React + Vite
- **Styling:** Tailwind CSS
- **Real-time:** Socket.io-client
- **HTTP:** Axios

---

## Quick Start

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`. Expects LeadGen Backend at `http://localhost:5002`.

Create `.env`:
```
VITE_API_URL=http://localhost:5002/api
VITE_META_APP_ID=          # Meta WhatsApp App ID (production)
VITE_META_SIGNUP_CONFIG_ID= # Meta Embedded Signup config (production)
```

---

## Features

- **Lead Management** — create, view, score (HOT/WARM/COLD), delete leads from Facebook/Google/manual sources
- **AI Voice Calls** — trigger outbound AI calls per lead, view call history with transcripts
- **WhatsApp** — send messages, manage templates, connect Meta number (`/whatsapp-setup`, `/whatsapp-templates`)
- **Email** — compose and send emails via connected Gmail/Outlook account
- **Chat Dashboard** — real-time messaging with delivery ticks (sent/delivered/read/failed), message deduplication, new conversation dialog
- **Bulk Campaigns** — batch WhatsApp + email + voice campaigns with queue management
- **Lead Automation** — scheduled follow-up sequences
- **Facebook Lead Ads** — OAuth integration for auto-importing leads
- **Google Ads** — auto-import from Google campaigns
- **Call Logs** — paginated table with search + expandable transcripts (`/call-logs`)
- **Integrations** — configure WhatsApp, voice, and project source webhooks (`/integrations`)
- **Projects (Phase 2 only)** — per-project settings, automation, and the WhatsApp Template engine (generate/re-apply/retry/sync, status badges, welcome-template + no-image indicators)

---

## Phase 1 / Phase 2 (build flag)

Set `VITE_PHASE` at build time — the backend is shared:

| | Phase 1 | Phase 2 |
|-|---------|---------|
| `VITE_PHASE` | `1` | `2` (default) |
| Domain | webmagnetmedia.com | oneemployee.in |
| Brand | Web Magnet Media | OneEmployee |
| Projects / HIT / Templates | hidden | visible |

`src/config/phase.js` derives branding + `FEATURES` flags. Only `projects`, `hitIntegration`, `hitLinking`, `addProject` are Phase-2-only; everything else is in both.

---

## Key Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard / lead pipeline |
| `/leads` | All leads table |
| `/call-logs` | AI voice call history |
| `/chat` | Chat dashboard |
| `/campaigns` | Bulk campaign management |
| `/integrations` | WhatsApp + voice + webhook settings |
| `/whatsapp-setup` | Connect Meta WhatsApp number |
| `/whatsapp-templates` | Create/manage WA templates |
| `/projects` | Projects list (Phase 2) |
| `/projects/:id` | Project settings — Automation / WhatsApp Templates / Linked Sources (Phase 2) |

---

## Auth

Email-based flow using MSG91 OTP Widget:
1. Register: Name + Email + Mobile → OTP → set 6-digit PIN → JWT cookie
2. Login: Email + PIN → JWT cookie (no OTP)
3. Forgot PIN: Email → OTP → set new PIN

---

## Project Structure

```
src/
├── pages/          — Page-level components
├── components/     — Reusable UI components
├── api.js          — All Axios API calls (centralized)
├── App.jsx         — Routes
└── main.jsx        — Entry point
```

All API calls go through `src/api.js` — add new functions there rather than inline axios calls.

---

## Chat Message Deduplication

The chat dashboard uses optimistic rendering: messages appear instantly and are replaced with server-confirmed versions. Since the backend emits Socket.IO events **and** returns messages in HTTP responses, the frontend has multi-layer dedup:

1. **By `_id`** — if the message already exists (from API response), socket event is ignored
2. **By `wamid`** — same WhatsApp message ID won't duplicate
3. **By optimistic match** — socket events matching a pending temp message replace it in-place
4. **API response handler** — checks if socket already delivered the real message before replacing

This prevents the "double message" issue where the same outbound message appears twice in the chat window.
