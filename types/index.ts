export interface Activity {
  id: string;
  name: string;
  city: string;
  images: string[];
  average_rating: number;
  total_reviews: number;
  price_min: number;
  price_max: number;
  is_free: boolean;
  age_min: number;
  age_max: number;
  location_lat: number;
  location_lng: number;
  is_indoor: boolean;
  is_outdoor: boolean;
  description?: string;
  website_url?: string;
  address?: string;
  category_id?: string;
  is_featured?: boolean;
  is_seasonal?: boolean;
  type?: 'event' | 'venue';
  event_start_datetime?: string;
  event_end_datetime?: string;
  venue_opening_hours?: {
    [day: string]: { open: string; close: string; closed?: boolean };
  };
}

export interface Venue {
  id: string;
  name: string;
  description_en: string;
  description_nl: string;
  city: string;
  province: string;
  address: string;
  location_lat: number;
  location_lng: number;
  phone?: string;
  email?: string;
  website?: string;
  images: string[];
  venue_opening_hours?: {
    [day: string]: { open: string; close: string; closed?: boolean };
  };
  average_rating: number;
  total_reviews: number;
  price_min: number;
  price_max: number;
  is_free: boolean;
  age_min: number;
  age_max: number;
  is_indoor: boolean;
  is_outdoor: boolean;
  weather_dependent: boolean;
  booking_url?: string;
  is_featured: boolean;
  is_seasonal: boolean;
  season_start?: string;
  season_end?: string;
  categories?: string[];
}

export interface Event {
  id: string;
  name: string;
  description_en: string;
  description_nl: string;
  city: string;
  province: string;
  address: string;
  location_lat: number;
  location_lng: number;
  phone?: string;
  email?: string;
  website?: string;
  images: string[];
  event_start_datetime: string;
  event_end_datetime: string;
  average_rating: number;
  total_reviews: number;
  price_min: number;
  price_max: number;
  is_free: boolean;
  age_min: number;
  age_max: number;
  is_indoor: boolean;
  is_outdoor: boolean;
  weather_dependent: boolean;
  booking_url?: string;
  is_featured: boolean;
  categories?: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color_start: string;
  color_end: string;
}

export interface Kid {
  id: string;
  profile_id: string;
  name: string | null;
  birth_year: number;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
}

export interface ActivityFilters {
  indoor?: boolean;
  outdoor?: boolean;
  free?: boolean;
  minAge?: string;
  maxAge?: string;
  maxDistance?: string;
  categoryId?: string;
}

export interface VenueFilters {
  indoor?: boolean;
  outdoor?: boolean;
  free?: boolean;
  minAge?: string;
  maxAge?: string;
  maxDistance?: string;
  categoryId?: string;
}

export interface EventFilters {
  indoor?: boolean;
  outdoor?: boolean;
  free?: boolean;
  minAge?: string;
  maxAge?: string;
  maxDistance?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}
