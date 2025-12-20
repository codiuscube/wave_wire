-- Add sort_order column to user_spots for drag-and-drop reordering
ALTER TABLE user_spots
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Set initial sort order based on created_at (oldest = 0, newest = highest)
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) - 1 as new_order
  FROM user_spots
)
UPDATE user_spots
SET sort_order = ordered.new_order
FROM ordered
WHERE user_spots.id = ordered.id;

-- Add index for efficient ordering queries
CREATE INDEX idx_user_spots_sort_order ON user_spots(user_id, sort_order);
