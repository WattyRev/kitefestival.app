-- Migration to add event support to the kite festival app

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    startDate TIMESTAMP NOT NULL,
    endDate TIMESTAMP NOT NULL,
    isActive BOOLEAN DEFAULT FALSE,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add eventId column to activities table
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS eventId VARCHAR(255) REFERENCES events(id);

-- Add eventId column to comments table (optional, for event-specific comment filtering)
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS eventId VARCHAR(255) REFERENCES events(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_activities_event_id ON activities(eventId);
CREATE INDEX IF NOT EXISTS idx_comments_event_id ON comments(eventId);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(isActive);

-- Update the changes table to track event changes
-- This assumes the changes table already exists from your current system
