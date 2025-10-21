/*
  # Update Category Colors

  1. Changes
    - Replace blue category colors with teal (#0D9488)
    - Ensures visual consistency with the app's color palette
    - Updates any cyan/blue colors to the new deeper teal

  2. Notes
    - Updates activity_categories that use blue/cyan colors
    - New color matches the secondary color in the app theme
    - Affects 13 categories including Spring Fun, Autumn Fun, etc.
*/

-- Update any blue/cyan colored categories to teal
UPDATE activity_categories
SET color = '#0D9488'
WHERE color IN (
  '#06b6d4',  -- cyan-500
  '#0891b2',  -- cyan-600
  '#0e7490',  -- cyan-700
  '#3b82f6',  -- blue-500
  '#2563eb',  -- blue-600
  '#1d4ed8',  -- blue-700
  '#0ea5e9',  -- sky-500 (currently used by 13 categories)
  '#0284c7',  -- sky-600
  '#0369a1'   -- sky-700
);
