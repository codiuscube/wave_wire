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
| Backend | Supabase (Auth + Postgres + Edge Functions) |
| Weather Data | Open-Meteo Marine API (free) |
| Buoy Data | NOAA NDBC |
| AI Messaging | Claude Haiku (planned) |
| SMS | Twilio (pending A2P approval) |

---

## Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Landing Page | Done | Marketing site with animated notifications |
| Authentication | Done | Email/password via Supabase |
| User Profiles | Done | Phone, address, subscription tier |
| Surf Spots Database | Done | 1,225 pre-loaded spots (USA, Mexico, Central America, Canada) |
| Admin Spot Management | Done | Verify, edit, add spots |
| User Spots | Done | Add spots from database, assign buoys |
| NOAA Buoy Integration | Done | Live data fetch with caching |
| Open-Meteo Forecast | Done | Marine + weather API integration |
| Tide Data | Done | NOAA CO-OPS API integration |
| Triggers System | In Progress | Define conditions per spot |
| Alert Scheduling | Partial | UI done, backend not implemented |
| Personality Selection | Partial | UI components exist, no dedicated page |
| Edge Functions | Not Started | Data fetching, alert processing |
| SMS Alerts | Not Started | Pending Twilio A2P approval |
| Email Fallback | Not Started | For free tier users |
| Claude AI Messages | Not Started | Personality-driven alert text |
| Traffic Integration | Not Started | Google Routes API planned |
| Locals Knowledge | Not Started | Spot-level condition parameters |

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
| `/dashboard/spot` | Manage spots | Yes |
| `/dashboard/triggers` | Configure triggers | Yes |
| `/dashboard/alerts` | Alert schedule | Yes |
| `/dashboard/account` | Account settings | Yes |
| `/admin/spots` | Admin spot management | Yes (admin) |

---

## License

MIT
