# Script AI — Web App

Next.js 15 frontend for Script AI. App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui.

## Pages

| Route | Status | Description |
|-------|--------|-------------|
| `/` | Done | Landing page with features, pricing, CTA |
| `/login` | Done | Email/password + Google OAuth |
| `/signup` | Done | Multi-step signup with referral code support |
| `/forgot-password` | Done | OTP-based password reset |
| `/reset-password` | Done | OTP verification + new password |
| `/dashboard` | Done | Welcome hub, onboarding, recent scripts |
| `/dashboard/train` | Done | AI style training with YouTube videos |
| `/dashboard/scripts` | Done | Script list, create, edit, export as PDF |
| `/dashboard/research` | Done | Idea research, list, view, export as PDF |
| `/dashboard/subtitles` | Done | Upload video, generate/edit/export subtitles |
| `/dashboard/dubbing` | Coming soon | Dubbing project list (UI with overlay) |
| `/dashboard/thumbnails` | Coming soon | Thumbnail generator (UI with overlay) |
| `/dashboard/courses` | Coming soon | Course module builder (UI with overlay) |
| `/dashboard/settings` | Done | Profile, notifications, billing |
| `/dashboard/referrals` | Done | Referral code, stats, history |
| `/privacy` | Done | Privacy policy and terms |

## API Routes

18 server-side API routes under `app/api/` handling script generation, research, subtitles, referrals, auth callbacks, YouTube OAuth, avatar uploads, course modules, thumbnails, and issue reporting.

## Key Integrations

- **Supabase** — Auth, database, storage
- **Google Gemini AI** — Scripts, research, training transcription
- **OpenAI GPT-4o** — Subtitles, thumbnails
- **YouTube Data API** — Channel connection, video metadata
- **Resend** — Transactional emails

## Setup

```bash
cp .env.example .env
# Fill in credentials (see .env.example)
pnpm install
pnpm run dev
```

Runs at [http://localhost:3000](http://localhost:3000).
