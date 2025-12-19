-- Add notification_style column to triggers table
-- Stores the user's preferred message style: 'local', 'hype', or 'custom'

ALTER TABLE triggers
ADD COLUMN notification_style TEXT
CHECK (notification_style IN ('local', 'hype', 'custom'));

-- Set default for existing triggers
UPDATE triggers
SET notification_style = 'local'
WHERE notification_style IS NULL;
