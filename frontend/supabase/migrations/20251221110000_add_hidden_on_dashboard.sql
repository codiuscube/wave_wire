-- Add hidden_on_dashboard column to user_spots for dashboard visibility control
ALTER TABLE user_spots
ADD COLUMN hidden_on_dashboard BOOLEAN DEFAULT FALSE;

-- Add index for efficient filtering of visible spots
CREATE INDEX idx_user_spots_hidden ON user_spots(user_id, hidden_on_dashboard);
