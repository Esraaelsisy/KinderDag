/*
  # Allow Unconfirmed Users to Access the App

  This migration ensures users can sign in immediately after registration.
  
  1. Changes
    - Marks all existing unconfirmed users as email-confirmed
    - This allows them to sign in without waiting for email verification
    - The confirmed_at column will automatically update (it's a generated column)
  
  2. Important Notes
    - Email confirmations should be disabled in Supabase Dashboard:
      Dashboard > Authentication > Email Auth > Enable email confirmations = OFF
    - This prevents future signups from requiring email confirmation
    - Confirmation emails can still be sent but won't block access
  
  3. Security
    - Users can access the app immediately after signup
    - Email verification can be added later if needed for specific features
*/

-- Allow all existing unconfirmed users to sign in immediately
-- Sets their email_confirmed_at to their creation time
-- The confirmed_at column will automatically update as it's generated from email_confirmed_at
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, created_at)
WHERE email_confirmed_at IS NULL;