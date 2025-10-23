/*
  # Auto-create profile on user signup

  1. Changes
    - Create a trigger function that automatically creates a profile when a new user signs up
    - This ensures profiles are created within the auth context, avoiding RLS issues
    - Profile is created with default values and onboarding_completed = false
  
  2. Security
    - Runs with SECURITY DEFINER to bypass RLS during profile creation
    - Only creates profile for new auth.users, no other modifications
*/

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, language, push_notifications_enabled, onboarding_completed)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'en',
    true,
    false
  );
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
