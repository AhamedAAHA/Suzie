# SUZIE AI

**The Global Intelligence Assistant That Watches the World For You**

A futuristic AI command center that wakes on clap or voice, scans global signals, visualizes risks on a 3D globe, and explains ripple effects across supply chains, construction costs, and business risks.

## Features

- **Clap Wake Detection** — Web Audio API microphone clap detection
- **Voice Commands** — "Hey Suzie" + natural language queries via Web Speech API
- **3D Globe Dashboard** — React Three Fiber animated globe with risk markers and shipping routes
- **Live Intelligence** — Global news scanning with Bright Data API (mock fallback)
- **AI Reasoning** — AIML API for briefings, ripple analysis, and reports (mock fallback)
- **Ripple Simulator** — What-if scenario modeling with animated impact chains
- **Construction Impact Mode** — QS-focused material risk and BOQ overrun prediction
- **Crisis DNA** — Structured crisis profiling with spread speed and confidence
- **Silent Watch Mode** — Background monitoring with voice alerts

## Tech Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS 4 + Framer Motion
- Three.js + React Three Fiber + Drei
- Recharts
- Web Audio API + Web Speech API
- Zustand state management

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Flow

1. **Landing Page** — Click "Activate SUZIE"
2. **Boot Screen** — Clap or say "Hey Suzie" (or click Manual Activate)
3. **Command Center** — Full 3D dashboard with live alerts, globe, and AI briefing

## API Keys

Copy `.env.example` to `.env.local` and fill in your keys:

```
AIML_API_KEY=...
BRIGHT_DATA_API_KEY=...
BRIGHT_DATA_SERP_ZONE=sentra_serp
NEWS_API_KEY=...
OPENWEATHER_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Verify all connections at **Settings → API Status** or `GET /api/health`.

| Service | Purpose |
|---------|---------|
| AIML API | AI briefings, voice Q&A, TTS |
| Bright Data SERP | Web/news search fallback |
| News API | Live global headlines |
| OpenWeather | Local weather risk events |
| Supabase | Reports cache, events cache, user prefs |

Without API keys, the app falls back to realistic mock data.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with 3D orb |
| `/boot` | Clap/voice wake screen |
| `/dashboard` | Main command center |
| `/simulator` | Ripple effect simulator |
| `/construction` | Construction impact mode |
| `/reports` | Intelligence report generator |
| `/settings` | User preferences & API config |

## Voice Commands

- "Show today's global risks"
- "Show risk to Sri Lanka"
- "Explain oil price impact"
- "Open construction mode"
- "Generate report"
- "Show supply chain risk"
- "Show disaster zones"
