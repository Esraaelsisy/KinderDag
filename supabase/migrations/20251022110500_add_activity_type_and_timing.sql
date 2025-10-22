/*
  # Add Activity Type and Timing Fields

  ## Changes
  This migration adds fields to support different activity types (Event vs Venue):

  1. New Columns Added to `activities` table:
    - `type` (text) - Either 'event' or 'venue', defaults to 'venue'
    - `event_start_datetime` (timestamptz) - Start date and time for events
    - `event_end_datetime` (timestamptz) - End date and time for events
    - `venue_opening_hours` (jsonb) - Opening hours structure for venues

  2. Notes:
    - Event fields are only relevant when type = 'event'
    - Venue opening hours are only relevant when type = 'venue'
    - The existing `opening_hours` field remains for backward compatibility
    - Default type is 'venue' to maintain backward compatibility with existing data
*/

-- Add new columns to activities table
DO $$
BEGIN
  -- Add type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activities' AND column_name = 'type'
  ) THEN
    ALTER TABLE activities ADD COLUMN type text DEFAULT 'venue' CHECK (type IN ('event', 'venue'));
  END IF;

  -- Add event start datetime
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activities' AND column_name = 'event_start_datetime'
  ) THEN
    ALTER TABLE activities ADD COLUMN event_start_datetime timestamptz;
  END IF;

  -- Add event end datetime
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activities' AND column_name = 'event_end_datetime'
  ) THEN
    ALTER TABLE activities ADD COLUMN event_end_datetime timestamptz;
  END IF;

  -- Add venue opening hours
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activities' AND column_name = 'venue_opening_hours'
  ) THEN
    ALTER TABLE activities ADD COLUMN venue_opening_hours jsonb;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN activities.type IS 'Type of activity: event (time-based) or venue (location-based)';
COMMENT ON COLUMN activities.event_start_datetime IS 'Start date and time for events (only used when type=event)';
COMMENT ON COLUMN activities.event_end_datetime IS 'End date and time for events (only used when type=event)';
COMMENT ON COLUMN activities.venue_opening_hours IS 'Opening hours for venues (only used when type=venue)';
