/*
  # Create cities table for Netherlands locations

  1. New Tables
    - `cities`
      - `id` (uuid, primary key)
      - `name` (text, unique) - City name
      - `province` (text) - Province name
      - `latitude` (double precision) - City latitude
      - `longitude` (double precision) - City longitude
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `cities` table
    - Add policy for public read access (cities are public data)
    - Add policy for authenticated admin users to manage cities

  3. Data
    - Pre-populate with major Netherlands cities
*/

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  province text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cities"
  ON cities
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert cities"
  ON cities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cities"
  ON cities
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cities"
  ON cities
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert major Netherlands cities with coordinates
INSERT INTO cities (name, province, latitude, longitude) VALUES
  ('Amsterdam', 'Noord-Holland', 52.3676, 4.9041),
  ('Rotterdam', 'Zuid-Holland', 51.9244, 4.4777),
  ('The Hague', 'Zuid-Holland', 52.0705, 4.3007),
  ('Utrecht', 'Utrecht', 52.0907, 5.1214),
  ('Eindhoven', 'Noord-Brabant', 51.4416, 5.4697),
  ('Groningen', 'Groningen', 53.2194, 6.5665),
  ('Tilburg', 'Noord-Brabant', 51.5555, 5.0913),
  ('Almere', 'Flevoland', 52.3508, 5.2647),
  ('Breda', 'Noord-Brabant', 51.5719, 4.7683),
  ('Nijmegen', 'Gelderland', 51.8126, 5.8372),
  ('Enschede', 'Overijssel', 52.2215, 6.8937),
  ('Haarlem', 'Noord-Holland', 52.3874, 4.6462),
  ('Arnhem', 'Gelderland', 51.9851, 5.8987),
  ('Zaanstad', 'Noord-Holland', 52.4391, 4.8275),
  ('Amersfoort', 'Utrecht', 52.1561, 5.3878),
  ('Apeldoorn', 'Gelderland', 52.2112, 5.9699),
  ('Hoofddorp', 'Noord-Holland', 52.3025, 4.6892),
  ('Maastricht', 'Limburg', 50.8514, 5.6909),
  ('Leiden', 'Zuid-Holland', 52.1601, 4.4970),
  ('Dordrecht', 'Zuid-Holland', 51.8133, 4.6901),
  ('Zoetermeer', 'Zuid-Holland', 52.0575, 4.4932),
  ('Zwolle', 'Overijssel', 52.5168, 6.0830),
  ('Deventer', 'Overijssel', 52.2551, 6.1639),
  ('Delft', 'Zuid-Holland', 52.0116, 4.3571),
  ('Alkmaar', 'Noord-Holland', 52.6325, 4.7494),
  ('Leeuwarden', 'Friesland', 53.2012, 5.7999),
  ('Den Bosch', 'Noord-Brabant', 51.6978, 5.3037),
  ('Hilversum', 'Noord-Holland', 52.2242, 5.1758),
  ('Roosendaal', 'Noord-Brabant', 51.5308, 4.4653),
  ('Purmerend', 'Noord-Holland', 52.5051, 4.9592),
  ('Schiedam', 'Zuid-Holland', 51.9192, 4.3964),
  ('Spijkenisse', 'Zuid-Holland', 51.8447, 4.3297),
  ('Alphen aan den Rijn', 'Zuid-Holland', 52.1287, 4.6574),
  ('Hoorn', 'Noord-Holland', 52.6426, 5.0597),
  ('Vlaardingen', 'Zuid-Holland', 51.9122, 4.3419),
  ('Alblasserdam', 'Zuid-Holland', 51.8652, 4.6596),
  ('Capelle aan den IJssel', 'Zuid-Holland', 51.9288, 4.5775),
  ('Veenendaal', 'Utrecht', 52.0279, 5.5581),
  ('Oss', 'Noord-Brabant', 51.7650, 5.5183),
  ('Zeist', 'Utrecht', 52.0894, 5.2378)
ON CONFLICT (name) DO NOTHING;