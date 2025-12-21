# Claude Code Instructions

## Project Overview

Homebreak is a surf alert application built with React + Vite frontend and Supabase backend.

## Directory Structure

- `frontend/` - React application (Vite, Tailwind, shadcn/ui)
- `frontend/supabase/` - Supabase config and migrations (NOT at project root)
- `docs/` - Project documentation

## Supabase CLI

**Important:** All Supabase CLI commands must be run from the `frontend/` directory:

```bash
cd frontend
supabase link --project-ref <ref>
supabase db push
supabase gen types typescript --linked > src/types/supabase.ts
```

## Documentation Requirements

When creating PRs or making significant changes, update the relevant documentation:

### Database Changes
- Add new migrations to `docs/DATABASE.md` Migration History table
- Update schema definitions if table structure changes
- Update RLS policy summary if policies change

### New Features
- Update `docs/FEATURES.md` with feature descriptions
- Update feature status matrix in `docs/README.md`

### API Changes
- Update `docs/API_INTEGRATION.md` for external API changes
- Document new hooks or services

### Development Workflow Changes
- Update `docs/DEVELOPMENT.md` for:
  - New environment variables
  - New scripts
  - Changed deployment procedures
  - New dependencies

### Architecture Changes
- Update `docs/ARCHITECTURE.md` for system design changes

## PR Checklist

Before creating a PR, verify:
1. All new migrations are documented in `docs/DATABASE.md`
2. New features are reflected in `docs/FEATURES.md`
3. Any CLI command changes are in `docs/DEVELOPMENT.md`
4. TypeScript types are regenerated if schema changed: `supabase gen types typescript --linked > src/types/supabase.ts`
