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
- **Voice Settings** — Sarvam (premium) / Google Chirp3 HD (cheaper) voice selector, custom prompt, sector, language, knowledge base docs
- **WhatsApp AI Auto-Reply** — AI replies to incoming WA messages with configurable delay (1-30 min), custom prompt, locked when WA not connected
- **WhatsApp** — send messages, manage templates, connect Meta number (`/whatsapp-setup`, `/whatsapp-templates`)
- **Email** — compose and send emails via connected Gmail/Outlook account
- **Chat Dashboard** — real-time messaging with delivery ticks (sent/delivered/read/failed)
- **Bulk Campaigns** — batch WhatsApp + email + voice campaigns with queue management
- **Lead Automation** — scheduled follow-up sequences
- **Facebook Lead Ads** — OAuth integration for auto-importing leads
- **Google Ads** — auto-import from Google campaigns
- **Call Logs** — paginated table with search + expandable transcripts (`/call-logs`)
- **Integrations** — configure WhatsApp, voice, and project source webhooks (`/integrations`)

---

## Key Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard / lead pipeline |
| `/leads` | All leads table |
| `/call-logs` | AI voice call history + Voice Settings + WhatsApp AI |
| `/chat` | Chat dashboard |
| `/campaigns` | Bulk campaign management |
| `/integrations` | WhatsApp + voice + webhook settings |
| `/whatsapp-setup` | Connect Meta WhatsApp number |
| `/whatsapp-templates` | Create/manage WA templates |

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
