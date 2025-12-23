-- Surf Sessions table for logging surf sessions with auto-fetched conditions
CREATE TABLE public.surf_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES public.user_spots(id) ON DELETE CASCADE,
  session_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  quality TEXT NOT NULL CHECK (quality IN ('flat', 'poor', 'fair', 'good', 'epic')),
  crowd TEXT NOT NULL CHECK (crowd IN ('empty', 'light', 'moderate', 'crowded', 'packed')),
  notes TEXT,
  conditions JSONB,  -- auto-fetched wave/wind/tide snapshot (typed as SessionConditions)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast filtering
CREATE INDEX idx_surf_sessions_user ON public.surf_sessions(user_id);
CREATE INDEX idx_surf_sessions_spot ON public.surf_sessions(spot_id);
CREATE INDEX idx_surf_sessions_date ON public.surf_sessions(session_date DESC);

-- RLS: users can only CRUD their own sessions
ALTER TABLE public.surf_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.surf_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
  ON public.surf_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON public.surf_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
  ON public.surf_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_surf_sessions_updated_at
  BEFORE UPDATE ON public.surf_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
