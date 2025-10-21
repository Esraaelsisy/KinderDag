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
