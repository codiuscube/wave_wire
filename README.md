# Wave-Wire

The invisible surf check. No apps to open, no feeds to scroll - just a buddy that texts you when it's actually good.

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

## Documentation

All documentation is in the [`/docs`](./docs/) folder:

| Document | Description |
|----------|-------------|
| [README](./docs/README.md) | Project overview, tech stack, feature status |
| [Architecture](./docs/ARCHITECTURE.md) | System design, data flow, edge functions |
| [Database](./docs/DATABASE.md) | Supabase schema, tables, RLS policies |
| [API Integration](./docs/API_INTEGRATION.md) | NOAA, Open-Meteo, Tide APIs |
| [Features](./docs/FEATURES.md) | Spots, triggers, alerts, personality specs |
| [Development](./docs/DEVELOPMENT.md) | Setup, environment, deployment, scripts |

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Supabase (Auth + Postgres + Edge Functions)
- **Data Sources**: NOAA NDBC, Open-Meteo, NOAA CO-OPS

## License

MIT
