# Script AI: Personalized AI Tool for YouTube Creators

> **AI that learns your style and helps you create content faster.** Script AI analyzes your existing YouTube videos to understand your tone, vocabulary, and structure — then generates scripts, subtitles, research, and more, all personalized to you.

[![Discord](https://img.shields.io/badge/Discord-Join%20Community-7289DA?style=for-the-badge&logo=discord)](https://discord.com/invite/k9sZcq2gNG)
[![GitHub Stars](https://img.shields.io/github/stars/scriptaiapp/scriptai?style=for-the-badge)](https://github.com/scriptaiapp/scriptai/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

## Features

### Implemented

- **AI Style Training** — Connect YouTube, provide 3–5 videos, and the AI learns your unique style
- **Script Generation** — Personalized video scripts with tone, duration, and language options; export as PDF
- **Idea Research** — AI-powered topic research with live web search, trends, content angles, and sources
- **Subtitle Generation** — Upload video, auto-generate timed subtitles, translate, edit, and burn into video
- **Audio/Video Dubbing** — Dub media into 24+ languages via Murf.ai (backend ready, frontend coming soon)
- **Credit System** — 10 free credits on signup, consumed per AI operation, tracked automatically
- **Referral Program** — Unique referral codes, track referrals, earn bonus credits
- **Auth** — Email/password and Google OAuth, OTP-based password reset, email verification
- **Profile & Settings** — Avatar upload, notification preferences, billing info

### Coming Soon

- **Thumbnail Generator** — AI-generated thumbnail descriptions (backend route exists)
- **Course Module Builder** — Structured course outlines from a topic (backend route exists)
- **AI Video Generator** — Page placeholder at `/dashboard/video-gen`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | NestJS, TypeScript, Zod validation |
| Database | Supabase (PostgreSQL), Row-Level Security |
| Auth | Supabase Auth (JWT), Google OAuth |
| AI | Google Gemini 2.5 Flash, OpenAI GPT-4o |
| Dubbing | Murf.ai |
| Jobs | BullMQ + Redis |
| Media | FFmpeg, Supabase Storage |
| Email | Resend |
| Monorepo | Turborepo + pnpm workspaces |

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Git
- Docker (for Redis — optional, can use external Redis)

### Setup

```bash
git clone https://github.com/scriptaiapp/scriptai.git
cd scriptai
pnpm install
```

**Supabase:**

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Get your Database URL from Settings → Database → Connection String
3. Apply schema:
   ```bash
   pnpx supabase login
   pnpx supabase db push --db-url <your-supabase-db-url>
   ```

**Environment variables:**

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

Edit both `.env` files with your credentials. See `.env.example` files for required keys.

**Start:**

```bash
# Optional: start Redis via Docker
docker compose up -d

# Start dev servers
pnpm run dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:8000](http://localhost:8000)

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start all dev servers |
| `pnpm run build` | Build all packages and apps |
| `pnpm run test` | Run tests |
| `pnpm run lint` | Lint all code |
| `pnpm run format` | Format with Prettier |

## Project Structure

```
scriptai/
├── apps/
│   ├── web/                         # Next.js frontend
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   │   ├── train/           # AI style training
│   │   │   │   ├── scripts/         # Script generation & editing
│   │   │   │   ├── research/        # Idea research
│   │   │   │   ├── subtitles/       # Subtitle generation & editing
│   │   │   │   ├── dubbing/         # Audio/video dubbing
│   │   │   │   ├── thumbnails/      # Thumbnail generator (coming soon)
│   │   │   │   ├── courses/         # Course builder (coming soon)
│   │   │   │   ├── settings/        # User settings
│   │   │   │   └── referrals/       # Referral program
│   │   │   └── api/                 # Next.js API routes
│   │   ├── components/              # React components
│   │   ├── hooks/                   # Custom hooks
│   │   └── lib/                     # Utilities
│   └── api/                         # NestJS backend
│       └── src/
│           ├── auth/                # Password reset flow
│           ├── subtitle/            # Subtitle CRUD + burn
│           ├── dubbing/             # Dubbing via Murf.ai
│           ├── train-ai/            # AI training job queue
│           └── supabase/            # Supabase client
├── packages/
│   ├── validations/                 # Shared Zod schemas & types
│   ├── supabase/                    # Supabase client utilities
│   ├── email-templates/             # Email templates (OTP, welcome)
│   ├── train-ai-worker/             # BullMQ worker for AI training
│   ├── config/                      # Shared constants
│   ├── ui/                          # Shared UI components
│   └── api/                         # Shared API types
```

## Contributing

1. Join [Discord](https://discord.gg/k9sZcq2gNG)
2. Check issues labeled "Good First Issue"
3. Read [CONTRIBUTING.md](./CONTRIBUTING.md)
4. Fork, branch, code, and submit a PR

## Documentation

- [Requirements](./requirements.md) — Feature overview
- [Contributing Guide](./CONTRIBUTING.md) — How to contribute
- [Code of Conduct](./CODE_OF_CONDUCT.md) — Community guidelines
- [Security Policy](./SECURITY.md) — Security guidelines

## Community

- [Discord](https://discord.com/invite/k9sZcq2gNG)
- [GitHub](https://github.com/scriptaiapp/scriptai)
- [Issues](https://github.com/scriptaiapp/scriptai/issues)

## License

MIT — see [LICENSE](./LICENSE)
