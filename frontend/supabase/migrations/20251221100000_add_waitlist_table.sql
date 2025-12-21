-- Create waitlist table for email signup before launch
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invited')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT (public signup from landing page)
CREATE POLICY "Anyone can join waitlist" ON public.waitlist
  FOR INSERT WITH CHECK (true);

-- Only admins can SELECT
CREATE POLICY "Admins can view waitlist" ON public.waitlist
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Only admins can UPDATE (to change status)
CREATE POLICY "Admins can update waitlist" ON public.waitlist
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Only admins can DELETE
CREATE POLICY "Admins can delete waitlist" ON public.waitlist
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Index for faster queries
CREATE INDEX idx_waitlist_created_at ON public.waitlist(created_at DESC);
