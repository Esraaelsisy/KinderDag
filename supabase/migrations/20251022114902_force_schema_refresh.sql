/*
  # Force PostgREST Schema Cache Refresh

  This migration forces PostgREST to reload its schema cache by making a trivial change
  to the activities table and then reverting it.
*/

-- Add a temporary comment to force schema reload
COMMENT ON TABLE activities IS 'Activities and venues for families - schema refreshed';

-- Notify PostgREST to reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
