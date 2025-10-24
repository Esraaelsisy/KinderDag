/*
  # Change kids birth_year to birth_date

  1. Changes
    - Drop the existing birth_year column from kids table
    - Add birth_date column as date type
    - Update constraints to validate birth_date is not in the future
  
  2. Security
    - Maintains existing RLS policies
    - No changes to security model
*/

-- Add birth_date column
ALTER TABLE kids 
ADD COLUMN IF NOT EXISTS birth_date date CHECK (birth_date <= current_date);

-- Drop birth_year column
ALTER TABLE kids 
DROP COLUMN IF EXISTS birth_year;

-- Make birth_date NOT NULL
ALTER TABLE kids 
ALTER COLUMN birth_date SET NOT NULL;
