-- Function to check if an email already has an account
-- Used by waitlist form to redirect existing users to login
CREATE OR REPLACE FUNCTION public.email_has_account(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(email) = LOWER(check_email)
  );
END;
$$;

-- Allow anonymous users to call this function
GRANT EXECUTE ON FUNCTION public.email_has_account(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.email_has_account(TEXT) TO authenticated;
