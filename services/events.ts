import { supabase } from '@/lib/supabase';
import { Event, EventFilters } from '@/types';
import { calculateDistance } from '@/utils/location';

export const eventsService = {
  getAll: async (): Promise<Event[]> => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        place:places(*)
      `)
      .order('event_start_datetime', { ascending: true });

    if (error) throw error;
    return (data || []).map(transformEvent);
  },

  getUpcoming: async (limit?: number): Promise<Event[]> => {
    const now = new Date().toISOString();
    let query = supabase
      .from('events')
      .select(`
        *,
        place:places(*)
      `)
      .gte('event_start_datetime', now)
      .order('event_start_datetime', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(transformEvent);
  },

  getFeatured: async (limit = 10): Promise<Event[]> => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        place:places(*)
      `)
      .eq('is_featured', true)
      .gte('event_start_datetime', now)
      .order('event_start_datetime', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(transformEvent);
  },

  getByCategory: async (categoryId: string): Promise<Event[]> => {
    const { data, error } = await supabase
      .from('event_category_links')
      .select(`
        event:events(
          *,
          place:places(*)
        )
      `)
      .eq('category_id', categoryId);

    if (error) throw error;
    return (data || [])
      .map((item: any) => item.event)
      .filter(Boolean)
      .map(transformEvent);
  },

  getById: async (id: string): Promise<Event | null> => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        place:places(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? transformEvent(data) : null;
  },

  getByIds: async (ids: string[]): Promise<Event[]> => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        place:places(*)
      `)
      .in('id', ids)
      .order('event_start_datetime', { ascending: true });

    if (error) throw error;
    return (data || []).map(transformEvent);
  },

  search: async (query: string): Promise<Event[]> => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        place:places(*)
      `)
      .or(`custom_location_name.ilike.%${query}%,custom_city.ilike.%${query}%,place.name.ilike.%${query}%,place.city.ilike.%${query}%`)
      .order('event_start_datetime', { ascending: true });

    if (error) throw error;
    return (data || []).map(transformEvent);
  },

  getByDateRange: async (startDate: Date, endDate: Date): Promise<Event[]> => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        place:places(*)
      `)
      .gte('event_start_datetime', startDate.toISOString())
      .lte('event_start_datetime', endDate.toISOString())
      .order('event_start_datetime', { ascending: true });

    if (error) throw error;
    return (data || []).map(transformEvent);
  },

  filterEvents: (
    events: Event[],
    filters: EventFilters,
    userLat?: number,
    userLng?: number
  ): Event[] => {
    let filtered = [...events];

    if (filters.indoor && !filters.outdoor) {
      filtered = filtered.filter((e) => e.is_indoor);
    } else if (filters.outdoor && !filters.indoor) {
      filtered = filtered.filter((e) => e.is_outdoor);
    }

    if (filters.free) {
      filtered = filtered.filter((e) => e.is_free);
    }

    if (filters.minAge && filters.minAge !== '0') {
      const minAge = parseInt(filters.minAge);
      filtered = filtered.filter((e) => e.age_max >= minAge);
    }
    if (filters.maxAge && filters.maxAge !== '12') {
      const maxAge = parseInt(filters.maxAge);
      filtered = filtered.filter((e) => e.age_min <= maxAge);
    }

    if (filters.maxDistance && userLat && userLng) {
      const maxDist = parseFloat(filters.maxDistance);
      filtered = filtered.filter((e) => {
        const distance = calculateDistance(
          userLat,
          userLng,
          e.location_lat,
          e.location_lng
        );
        return distance <= maxDist;
      });
    }

    if (filters.categoryId) {
      filtered = filtered.filter((e) =>
        e.categories?.some(cat => cat === filters.categoryId)
      );
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter((e) => new Date(e.event_start_datetime) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filtered = filtered.filter((e) => new Date(e.event_start_datetime) <= endDate);
    }

    return filtered;
  },

  sortByDistance: (
    events: Event[],
    userLat: number,
    userLng: number
  ): Event[] => {
    return events.sort((a, b) => {
      const distA = calculateDistance(userLat, userLng, a.location_lat, a.location_lng);
      const distB = calculateDistance(userLat, userLng, b.location_lat, b.location_lng);
      return distA - distB;
    });
  },

  getWithDistance: (
    events: Event[],
    userLat: number,
    userLng: number
  ): (Event & { distance: number })[] => {
    return events.map((event) => ({
      ...event,
      distance: calculateDistance(
        userLat,
        userLng,
        event.location_lat,
        event.location_lng
      ),
    }));
  },
};

function transformEvent(data: any): Event {
  const place = data.place || {};
  return {
    id: data.id,
    name: place.name || data.custom_location_name || 'Event',
    description_en: data.description_en,
    description_nl: data.description_nl,
    city: place.city || data.custom_city || '',
    province: place.province || data.custom_province || '',
    address: place.address || data.custom_address || '',
    location_lat: place.location_lat || data.custom_lat || 0,
    location_lng: place.location_lng || data.custom_lng || 0,
    phone: place.phone,
    email: place.email,
    website: place.website,
    images: data.images || [],
    event_start_datetime: data.event_start_datetime,
    event_end_datetime: data.event_end_datetime,
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
  };
}
