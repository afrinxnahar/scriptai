# Script AI — API

NestJS backend for Script AI. Handles subtitles, dubbing, AI training, and auth.

## Endpoints

### Auth (`/api/v1/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/forgot-password` | Send OTP to email |
| POST | `/verify-otp` | Verify 6-digit OTP |
| POST | `/reset-password` | Reset password with verified OTP |

### Subtitles (`/api/v1/subtitle`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Generate subtitles with Gemini AI |
| GET | `/` | List user's subtitle jobs |
| POST | `/upload` | Upload video (max 200 MB) |
| PATCH | `/` | Update subtitle JSON |
| GET | `/:id` | Get single subtitle job |
| PATCH | `/:id` | Update subtitle by ID |
| DELETE | `/:id` | Delete subtitle job and file |
| POST | `/burn` | Burn subtitles into video (FFmpeg) |

### Dubbing (`/api/v1/dubbing`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create dubbing project (Murf.ai) |
| GET | `/status/:projectId` | SSE stream for dubbing progress |
| GET | `/` | List dubbing projects (paginated) |
| GET | `/:id` | Get dubbing project |
| DELETE | `/:id` | Delete dubbing project |

### AI Training (`/api/v1/train-ai`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Queue training job (BullMQ) |
| GET | `/status/:jobId` | SSE stream for training progress |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/api/v1/test-db` | Database connection test |

## Auth

All endpoints (except health) require a Supabase JWT in the `Authorization: Bearer <token>` header. Validated by `SupabaseAuthGuard`.

## Key Integrations

- **Supabase** — Database, auth, storage
- **Google Gemini AI** — Transcription, translation
- **Murf.ai** — Audio/video dubbing
- **BullMQ + Redis** — Job queue for AI training
- **FFmpeg** — Video processing
- **Resend** — OTP emails

## Setup

```bash
cp .env.example .env
# Fill in credentials (see .env.example)
pnpm install
pnpm run dev
```

Runs at [http://localhost:8000](http://localhost:8000).
