/*
  # Add onboarding completion flag to profiles table

  1. Changes
    - Add `onboarding_completed` boolean column to profiles table
    - Default to false for new profiles
    - Set existing profiles to true (they've already completed onboarding)
  
  2. Notes
    - This flag tracks whether a user has completed the onboarding flow
    - When false, users are redirected to /onboarding
    - When true, users proceed to the main app
*/

-- Add onboarding_completed column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;
END $$;

-- Set existing profiles to completed (they're already using the app)
UPDATE profiles 
SET onboarding_completed = true 
WHERE onboarding_completed IS NULL OR onboarding_completed = false;

-- Update default for new profiles
ALTER TABLE profiles 
ALTER COLUMN onboarding_completed SET DEFAULT false;
