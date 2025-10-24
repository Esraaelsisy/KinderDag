import { supabase } from '@/lib/supabase';
import { Venue, Event } from '@/types';

export const favoritesService = {
  getAll: async (userId: string): Promise<{ venues: Venue[]; events: Event[] }> => {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        venue_id,
        event_id,
        venue:venues(
          *,
          place:places(*)
        ),
        event:events(
          *,
          place:places(*)
        )
      `)
      .eq('profile_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const venues: Venue[] = [];
    const events: Event[] = [];

    data?.forEach((item: any) => {
      if (item.venue) {
        venues.push(transformVenue(item.venue));
      }
      if (item.event) {
        events.push(transformEvent(item.event));
      }
    });

    return { venues, events };
  },

  isFavoritedVenue: async (userId: string, venueId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('profile_id', userId)
      .eq('venue_id', venueId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  isFavoritedEvent: async (userId: string, eventId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('profile_id', userId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  addVenue: async (userId: string, venueId: string): Promise<void> => {
    const { error } = await supabase.from('favorites').insert({
      profile_id: userId,
      venue_id: venueId,
    });

    if (error) throw error;
  },

  addEvent: async (userId: string, eventId: string): Promise<void> => {
    const { error } = await supabase.from('favorites').insert({
      profile_id: userId,
      event_id: eventId,
    });

    if (error) throw error;
  },

  removeVenue: async (userId: string, venueId: string): Promise<void> => {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('profile_id', userId)
      .eq('venue_id', venueId);

    if (error) throw error;
  },

  removeEvent: async (userId: string, eventId: string): Promise<void> => {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('profile_id', userId)
      .eq('event_id', eventId);

    if (error) throw error;
  },

  toggleVenue: async (userId: string, venueId: string): Promise<boolean> => {
    const isFav = await favoritesService.isFavoritedVenue(userId, venueId);

    if (isFav) {
      await favoritesService.removeVenue(userId, venueId);
      return false;
    } else {
      await favoritesService.addVenue(userId, venueId);
      return true;
    }
  },

  toggleEvent: async (userId: string, eventId: string): Promise<boolean> => {
    const isFav = await favoritesService.isFavoritedEvent(userId, eventId);

    if (isFav) {
      await favoritesService.removeEvent(userId, eventId);
      return false;
    } else {
      await favoritesService.addEvent(userId, eventId);
      return true;
    }
  },

  getFavoriteIds: async (userId: string): Promise<{ venueIds: string[]; eventIds: string[] }> => {
    const { data, error } = await supabase
      .from('favorites')
      .select('venue_id, event_id')
      .eq('profile_id', userId);

    if (error) throw error;

    const venueIds: string[] = [];
    const eventIds: string[] = [];

    data?.forEach((item) => {
      if (item.venue_id) venueIds.push(item.venue_id);
      if (item.event_id) eventIds.push(item.event_id);
    });

    return { venueIds, eventIds };
  },
};

function transformVenue(data: any): Venue {
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
  };
}

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
