/*
  # Add event_name field to events table

  1. Changes
    - Add `event_name` column to `events` table
    - Column is required (NOT NULL) with a default empty string for existing rows
    - Text type for storing event names

  2. Notes
    - Existing events will have empty string as event_name
    - New events must provide an event_name
*/

-- Add event_name column to events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'event_name'
  ) THEN
    ALTER TABLE events ADD COLUMN event_name TEXT NOT NULL DEFAULT '';
  END IF;
END $$;
