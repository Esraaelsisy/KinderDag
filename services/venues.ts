import { supabase } from '@/lib/supabase';
import { Venue, VenueFilters } from '@/types';
import { calculateDistance } from '@/utils/location';

export const venuesService = {
  getAll: async (): Promise<Venue[]> => {
    const { data, error } = await supabase
      .from('venues')
      .select(`
        *,
        place:places(*),
        venue_collection_links(
          collection:collections(*)
        )
      `)
      .order('average_rating', { ascending: false});

    if (error) throw error;
    return (data || []).map(transformVenue);
  },

  getFeatured: async (limit = 10): Promise<Venue[]> => {
    const { data, error } = await supabase
      .from('venues')
      .select(`
        *,
        place:places(*),
        venue_collection_links(
          collection:collections(*)
        )
      `)
      .eq('is_featured', true)
      .order('average_rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(transformVenue);
  },

  getByCategory: async (categoryId: string): Promise<Venue[]> => {
    const { data, error } = await supabase
      .from('venue_category_links')
      .select(`
        venue:venues(
          *,
          place:places(*),
          venue_collection_links(
            collection:collections(*)
          )
        )
      `)
      .eq('category_id', categoryId);

    if (error) throw error;
    return (data || [])
      .map((item: any) => item.venue)
      .filter(Boolean)
      .map(transformVenue);
  },

  getById: async (id: string): Promise<Venue | null> => {
    const { data, error } = await supabase
      .from('venues')
      .select(`
        *,
        place:places(*),
        venue_collection_links(
          collection:collections(*)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? transformVenue(data) : null;
  },

  getByIds: async (ids: string[]): Promise<Venue[]> => {
    const { data, error } = await supabase
      .from('venues')
      .select(`
        *,
        place:places(*),
        venue_collection_links(
          collection:collections(*)
        )
      `)
      .in('id', ids)
      .order('average_rating', { ascending: false});

    if (error) throw error;
    return (data || []).map(transformVenue);
  },

  search: async (query: string): Promise<Venue[]> => {
    const { data, error } = await supabase
      .from('venues')
      .select(`
        *,
        place:places!inner(*),
        venue_collection_links(
          collection:collections(*)
        )
      `)
      .or(`place.name.ilike.%${query}%,place.city.ilike.%${query}%`)
      .order('average_rating', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformVenue);
  },

  filterVenues: (
    venues: Venue[],
    filters: VenueFilters,
    userLat?: number,
    userLng?: number
  ): Venue[] => {
    let filtered = [...venues];

    if (filters.indoor && !filters.outdoor) {
      filtered = filtered.filter((v) => v.is_indoor);
    } else if (filters.outdoor && !filters.indoor) {
      filtered = filtered.filter((v) => v.is_outdoor);
    }

    if (filters.free) {
      filtered = filtered.filter((v) => v.is_free);
    }

    if (filters.minAge && filters.minAge !== '0') {
      const minAge = parseInt(filters.minAge);
      filtered = filtered.filter((v) => v.age_max >= minAge);
    }
    if (filters.maxAge && filters.maxAge !== '12') {
      const maxAge = parseInt(filters.maxAge);
      filtered = filtered.filter((v) => v.age_min <= maxAge);
    }

    if (filters.maxDistance && userLat && userLng) {
      const maxDist = parseFloat(filters.maxDistance);
      filtered = filtered.filter((v) => {
        const distance = calculateDistance(
          userLat,
          userLng,
          v.location_lat,
          v.location_lng
        );
        return distance <= maxDist;
      });
    }

    if (filters.categoryId) {
      filtered = filtered.filter((v) =>
        v.categories?.some(cat => cat === filters.categoryId)
      );
    }

    return filtered;
  },

  sortByDistance: (
    venues: Venue[],
    userLat: number,
    userLng: number
  ): Venue[] => {
    return venues.sort((a, b) => {
      const distA = calculateDistance(userLat, userLng, a.location_lat, a.location_lng);
      const distB = calculateDistance(userLat, userLng, b.location_lat, b.location_lng);
      return distA - distB;
    });
  },

  getWithDistance: (
    venues: Venue[],
    userLat: number,
    userLng: number
  ): (Venue & { distance: number })[] => {
    return venues.map((venue) => ({
      ...venue,
      distance: calculateDistance(
        userLat,
        userLng,
        venue.location_lat,
        venue.location_lng
      ),
    }));
  },
};

function transformVenue(data: any): Venue {
  const collections = (data.venue_collection_links || [])
    .map((link: any) => link.collection)
    .filter(Boolean);

  return {
    id: data.id,
    name: data.place.name,
    description_en: data.description_en,
    description_nl: data.description_nl,
    city: data.place.city,
    province: data.place.province,
    address: data.place.address,
    location_lat: data.place.location_lat,
    location_lng: data.place.location_lng,
    phone: data.place.phone,
    email: data.place.email,
    website: data.place.website,
    images: data.images || [],
    venue_opening_hours: data.venue_opening_hours,
    average_rating: data.average_rating,
    total_reviews: data.total_reviews,
    price_min: data.price_min,
    price_max: data.price_max,
    is_free: data.is_free,
    age_min: data.age_min,
    age_max: data.age_max,
    is_indoor: data.is_indoor,
    is_outdoor: data.is_outdoor,
    weather_dependent: data.weather_dependent,
    booking_url: data.booking_url,
    is_featured: data.is_featured,
    is_seasonal: data.is_seasonal,
    season_start: data.season_start,
    season_end: data.season_end,
    collections: collections.length > 0 ? collections : undefined,
  };
}
