-- Add home coordinates to profiles table
-- These are populated when user selects an address from autocomplete
-- Used to show nearby surf spots

ALTER TABLE profiles
ADD COLUMN home_lat DOUBLE PRECISION,
ADD COLUMN home_lon DOUBLE PRECISION;

-- Add comment for documentation
COMMENT ON COLUMN profiles.home_lat IS 'Latitude of user home address, populated from address autocomplete';
COMMENT ON COLUMN profiles.home_lon IS 'Longitude of user home address, populated from address autocomplete';
