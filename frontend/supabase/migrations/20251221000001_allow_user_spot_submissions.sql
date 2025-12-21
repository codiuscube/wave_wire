-- Migration: Allow any authenticated user to submit spots for admin review
-- Created: 2024-12-21
--
-- Previously only admins could insert into surf_spots.
-- Now any user can submit a spot with verified=false and source='user'.
-- Admins review and verify these submissions.

-- ============================================
-- 1. Add submitted_by column to track who submitted spots
-- ============================================
ALTER TABLE public.surf_spots
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES public.profiles(id);

-- Index for querying user submissions
CREATE INDEX IF NOT EXISTS idx_surf_spots_submitted_by ON public.surf_spots(submitted_by);

-- ============================================
-- 2. Update INSERT policy to allow user submissions
-- ============================================
-- Drop the old admin-only insert policy
DROP POLICY IF EXISTS "Admins can insert spots" ON public.surf_spots;

-- New policy: Admins can insert any spot, users can only insert unverified user-submitted spots
CREATE POLICY "Users can submit spots for review" ON public.surf_spots
  FOR INSERT WITH CHECK (
    -- Admins can insert anything
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
    OR
    -- Regular users can only insert unverified spots with source='user' and their own submitted_by
    (
      verified = FALSE
      AND source = 'user'
      AND submitted_by = auth.uid()
    )
  );

-- ============================================
-- 3. Update SELECT policy to let users see their own unverified submissions
-- ============================================
DROP POLICY IF EXISTS "Anyone can view verified spots" ON public.surf_spots;

CREATE POLICY "View verified spots or own submissions" ON public.surf_spots
  FOR SELECT USING (
    -- Anyone can see verified spots
    verified = TRUE
    OR
    -- Users can see their own unverified submissions
    submitted_by = auth.uid()
    OR
    -- Admins can see everything
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ============================================
-- 4. Prevent users from updating their own submissions (admins only)
-- The existing UPDATE policy already restricts to admins only
-- ============================================
-- No changes needed - existing "Admins can update spots" policy is correct

-- ============================================
-- 5. Prevent users from deleting submissions (admins only)
-- The existing DELETE policy already restricts to admins only
-- ============================================
-- No changes needed - existing "Admins can delete spots" policy is correct
