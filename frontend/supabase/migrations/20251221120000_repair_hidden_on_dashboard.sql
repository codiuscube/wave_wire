-- Repair: Add hidden_on_dashboard column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_spots' AND column_name = 'hidden_on_dashboard'
    ) THEN
        ALTER TABLE user_spots ADD COLUMN hidden_on_dashboard BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Ensure index exists
CREATE INDEX IF NOT EXISTS idx_user_spots_hidden ON user_spots(user_id, hidden_on_dashboard);
