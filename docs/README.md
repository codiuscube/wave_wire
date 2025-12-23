# Wave-Wire Documentation

The invisible surf check. No apps to open, no feeds to scroll - just a buddy that texts you when it's actually good.

## What is Wave-Wire?

Wave-Wire is a lightweight, "invisible" surf alert system that runs in the background and texts you only when your spot is actually firing. It combines real data (NOAA buoys, Open-Meteo) with a personality engine to deliver alerts that feel like a text from a local buddy.

**The Trust Metric**: Users don't double-check Surfline after receiving a Wave-Wire alert. They just grab their keys.

---

## Quick Start

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Icons | Lucide React |
| Backend | Supabase (Auth + Postgres) |
| Alert Processing | GitHub Actions (cron) |
| Weather Data | Open-Meteo Marine API (free) |
| Buoy Data | NOAA NDBC |
| Tide Data | NOAA CO-OPS |
| AI Messaging | Claude Haiku |
| Email | Resend API |
| Push Notifications | OneSignal |
| SMS | Twilio (pending A2P approval) |

---

## Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Landing Page | Done | Marketing site with animated notifications |
| Authentication | Done | Email/password via Supabase |
| User Profiles | Done | Phone, address, home coordinates |
| Surf Spots Database | Done | 1,225 pre-loaded spots (USA, Mexico, Central America, Canada) |
| Admin Spot Management | Done | Verify, edit, add spots with locals knowledge |
| User Spots | Done | Add spots from database, custom spots with map picker |
| Custom Spot Creation | Done | Natural language AI parsing, address autocomplete, map picker |
| Dashboard Spot Reordering | Done | Drag-and-drop reordering, visibility toggling |
| NOAA Buoy Integration | Done | Live data fetch with "no signal" fallback |
| Open-Meteo Forecast | Done | Marine + weather API, multiple wave models |
| Wave Model Selection | Done | Per-spot and per-trigger model selection |
| Region-Based Model Filtering | Done | Auto-filters models based on spot location |
| Tide Data | Done | NOAA CO-OPS API integration |
| Triggers System | Done | Define conditions per spot with AI Magic Fill |
| Buoy-Based Triggers | Done | Optional buoy conditions with AND/OR mode |
| Alert Scheduling | Done | Surveillance windows, active days, 2/5-day forecasts |
| Alert System Backend | Done | GitHub Actions cron job (every 2 hours) |
| Push Notifications | Done | OneSignal web push (PWA required on iOS) |
| Email Alerts | Done | Resend API with AI-generated messages |
| Claude AI Messages | Done | Personality-driven alert text generation |
| Locals Knowledge | Done | Spot-level optimal conditions for AI Magic Fill |
| Surf Log | Done | Session tracking with auto-fetched conditions |
| Waitlist & Referrals | Done | Pre-launch email capture with referral system |
| SMS Alerts | Not Started | Pending Twilio A2P approval |
| Traffic Integration | Not Started | Google Routes API planned |

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, data flow, edge functions |
| [DATABASE.md](./DATABASE.md) | Supabase schema, tables, RLS policies |
| [API_INTEGRATION.md](./API_INTEGRATION.md) | NOAA, Open-Meteo, Tide, Traffic APIs |
| [FEATURES.md](./FEATURES.md) | Feature specs (spots, triggers, alerts, personality) |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Setup, environment, deployment, scripts |

---

## Project Structure

```
homebreak-project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/        # Admin components
│   │   │   ├── auth/         # Auth components
│   │   │   ├── dashboard/    # Dashboard layout, sidebar
│   │   │   ├── landing/      # Marketing site sections
│   │   │   └── ui/           # Shared UI components
│   │   ├── contexts/         # React contexts (Auth, Theme, Location)
│   │   ├── data/             # Static data (surf spots, buoys)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Supabase client, mappers
│   │   ├── pages/            # Route pages
│   │   ├── services/         # API services
│   │   └── types/            # TypeScript types
│   ├── supabase/
│   │   ├── migrations/       # Database migrations
│   │   └── schema.sql        # Base schema
│   └── scripts/              # Utility scripts
├── docs/                     # Documentation (you are here)
└── README.md                 # Project entry point
```

---

## Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing page | No |
| `/login` | Login page | No |
| `/signup` | Signup page | No |
| `/reset-password` | Password reset | No |
| `/dashboard` | Dashboard overview | Yes |
| `/spots` | Manage spots | Yes |
| `/triggers` | Configure triggers | Yes |
| `/alerts` | Alert schedule | Yes |
| `/surf-log` | Session tracking | Yes |
| `/account` | Account settings | Yes |
| `/admin/spots` | Admin spot management | Yes (admin) |
| `/admin/spots/:id` | Admin spot detail/locals knowledge | Yes (admin) |
| `/admin/users` | Admin user management | Yes (admin) |
| `/admin/health` | System health monitoring | Yes (admin) |

---

## License

MIT
