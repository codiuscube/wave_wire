# Development Guide

This document covers local setup, environment configuration, migrations, deployment, and utility scripts.

---

## Prerequisites

- Node.js v18+
- npm
- Docker Desktop (for Supabase CLI local development)

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/codiuscube/homebreak.git
cd homebreak-project

# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Project Structure

```
homebreak-project/
├── frontend/
│   ├── api/                  # Vercel serverless functions
│   │   └── noaa-buoy.ts      # NOAA buoy proxy
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── contexts/         # React contexts
│   │   ├── data/             # Static data files
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Supabase client, mappers
│   │   ├── pages/            # Route pages
│   │   ├── services/         # API services
│   │   └── types/            # TypeScript types
│   ├── supabase/
│   │   ├── migrations/       # Database migrations
│   │   ├── schema.sql        # Base schema
│   │   └── config.toml       # Supabase config
│   ├── scripts/              # Utility scripts
│   └── package.json
├── docs/                     # Documentation
└── README.md
```

---

## Environment Variables

### Frontend (`.env` or `.env.local`)

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Google Analytics, etc.
```

### Server-side (Vercel environment)

```env
# For future traffic integration
GOOGLE_ROUTES_API_KEY=your-api-key

# Supabase service role (for edge functions)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Supabase Setup

### Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Verify installation
supabase --version
```

### Link to Project

```bash
cd frontend
supabase link --project-ref your-project-ref
```

### Generate TypeScript Types

```bash
cd frontend
supabase gen types typescript --linked > src/types/supabase.ts
```

### Run Migrations

Migrations are applied automatically when pushed to Supabase, or manually:

```bash
supabase db push
```

### Migration Files

| File | Description |
|------|-------------|
| `schema.sql` | Base schema (profiles, user_spots, triggers, etc.) |
| `20251216050123_add_admin_and_surf_spots.sql` | Admin flag, surf_spots table |
| `20251218041315_add_notification_style_to_triggers.sql` | Notification style column |
| `20251218085033_add_trigger_columns.sql` | Additional trigger columns |

---

## Scripts

### Process Surf Spots

Regenerate surf spots data from source gist:

```bash
cd frontend
node scripts/process-spots.cjs
```

This will:
1. Fetch spots from the source gist
2. Filter to North/Central America
3. Calculate recommended buoys
4. Generate `src/data/surfSpots.ts`

### Migrate Surf Spots to Supabase

Seed the `surf_spots` table with the 1,225 spots:

```bash
cd frontend
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
npx tsx scripts/migrate-surf-spots.ts
```

### Reset Onboarding

Reset a user's onboarding status (for testing):

```bash
cd frontend
npx tsx scripts/reset-onboarding.ts
```

---

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import repo in Vercel
3. Set the "Root Directory" to `frontend`
4. Configure environment variables
5. Deploy

**Settings:**
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

### Vercel Configuration

**File:** `frontend/vercel.json`

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## Development Workflow

### Available Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

### Code Organization

**Components:**
- `components/ui/` - Reusable UI primitives (Button, Input, etc.)
- `components/dashboard/` - Dashboard-specific components
- `components/landing/` - Marketing site components
- `components/admin/` - Admin-only components

**Hooks:**
- Data fetching hooks return `{ data, isLoading, error, refresh }`
- Supabase hooks include mutation methods
- API hooks handle caching automatically

**Contexts:**
- `AuthContext` - User session, admin status, loading state
- `ThemeContext` - Light/dark mode
- `LocationContext` - User geolocation

---

## Admin Access

### Enable Admin Mode (Development)

```javascript
// In browser console
localStorage.setItem('homebreak_admin_mode', 'true');
// Refresh the page
```

### Set Admin in Database (Production)

```sql
-- Temporarily disable protection trigger
ALTER TABLE public.profiles DISABLE TRIGGER protect_profile_sensitive_columns;

-- Set admin flag
UPDATE public.profiles SET is_admin = true
WHERE email IN ('admin@example.com');

-- Re-enable trigger
ALTER TABLE public.profiles ENABLE TRIGGER protect_profile_sensitive_columns;
```

---

## Debugging

### Check Supabase Connection

```typescript
import { supabase } from './lib/supabase';

// Test query
const { data, error } = await supabase.from('profiles').select('*').limit(1);
console.log({ data, error });
```

### View Network Requests

1. Open browser DevTools → Network tab
2. Filter by `supabase` or `ndbc.noaa.gov`
3. Check request/response details

### Common Issues

| Issue | Solution |
|-------|----------|
| CORS errors on NOAA | Use the Vercel proxy `/api/noaa-buoy` |
| Auth not persisting | Check `supabase.auth.getSession()` |
| RLS blocking queries | Check policies in Supabase Dashboard |
| Types out of sync | Run `supabase gen types typescript --linked` |

---

## Testing

### Manual Testing Checklist

- [ ] Landing page loads
- [ ] Can sign up / log in
- [ ] Onboarding flow completes
- [ ] Dashboard shows spots
- [ ] Can add/remove spots
- [ ] Triggers save correctly
- [ ] Buoy data loads
- [ ] Admin page accessible (if admin)

### Buoy Data Testing

Test specific buoy stations:
- `42035` - Galveston (reliable, Gulf)
- `46232` - Point Loma (Pacific)
- `51001` - NW Hawaii (offshore)

---

## Contributing

1. Create a feature branch
2. Make changes
3. Test locally
4. Submit PR to `main`

### Commit Convention

```
feat: add new feature
fix: bug fix
docs: documentation changes
refactor: code refactoring
style: formatting, no code change
test: adding tests
chore: maintenance tasks
```

---

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [React Router Docs](https://reactrouter.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [NOAA NDBC](https://www.ndbc.noaa.gov/)
- [Open-Meteo API](https://open-meteo.com/en/docs/marine-weather-api)
- [NOAA Tides API](https://api.tidesandcurrents.noaa.gov/api/prod/)
