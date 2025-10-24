import { supabase } from '../lib/supabase';

export interface Event {
  id?: string;
  place_id?: string | null;
  custom_location_name?: string;
  custom_address?: string;
  custom_lat?: number;
  custom_lng?: number;
  custom_city?: string;
  custom_province?: string;
  event_start_datetime: string;
  event_end_datetime: string;
  description_en: string;
  description_nl: string;
  age_min: number;
  age_max: number;
  price_min: number;
  price_max: number;
  is_free: boolean;
  is_indoor: boolean;
  is_outdoor: boolean;
  weather_dependent: boolean;
  booking_url?: string;
  images: string[];
  is_featured: boolean;
}

export const adminEventsService = {
  async getAll() {
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        place:places(*)
      `)
      .order('event_start_datetime', { ascending: false });

    if (error) throw error;
    if (!events) return [];

    const { data: categoryLinks } = await supabase
      .from('event_category_links')
      .select('*');

    const { data: allCategories } = await supabase
      .from('activity_categories')
      .select('*');

    return events.map(event => ({
      ...event,
      categories: categoryLinks
        ?.filter(link => link.event_id === event.id)
        .map(link => ({
          ...link,
          category: allCategories?.find(cat => cat.id === link.category_id)
        })) || [],
    }));
  },

  async getById(id: string) {
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        place:places(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!event) return null;

    const { data: categoryLinks } = await supabase
      .from('event_category_links')
      .select('*')
      .eq('event_id', id);

    let categories = [];
    if (categoryLinks && categoryLinks.length > 0) {
      const categoryIds = categoryLinks.map(link => link.category_id);
      const { data: cats } = await supabase
        .from('activity_categories')
        .select('*')
        .in('id', categoryIds);

      categories = categoryLinks.map(link => ({
        ...link,
        category: cats?.find(cat => cat.id === link.category_id)
      }));
    }

    return {
      ...event,
      categories,
    };
  },

  async create(event: Event, categoryIds: string[] = []) {
    const eventData: any = {
      place_id: event.place_id || null,
      event_start_datetime: event.event_start_datetime,
      event_end_datetime: event.event_end_datetime,
      description_en: event.description_en,
      description_nl: event.description_nl,
      age_min: event.age_min,
      age_max: event.age_max,
      price_min: event.price_min,
      price_max: event.price_max,
      is_free: event.is_free,
      is_indoor: event.is_indoor,
      is_outdoor: event.is_outdoor,
      weather_dependent: event.weather_dependent,
      booking_url: event.booking_url,
      images: event.images,
      is_featured: event.is_featured,
    };

    if (!event.place_id) {
      eventData.custom_location_name = event.custom_location_name;
      eventData.custom_address = event.custom_address;
      eventData.custom_lat = event.custom_lat;
      eventData.custom_lng = event.custom_lng;
      eventData.custom_city = event.custom_city;
      eventData.custom_province = event.custom_province;
    }

    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) throw error;

    if (categoryIds.length > 0) {
      await this.linkCategories(data.id, categoryIds);
    }

    return data;
  },

  async update(id: string, event: Partial<Event>, categoryIds?: string[]) {
    const eventUpdates: any = {};
    if (event.place_id !== undefined) eventUpdates.place_id = event.place_id;
    if (event.custom_location_name !== undefined) eventUpdates.custom_location_name = event.custom_location_name;
    if (event.custom_address !== undefined) eventUpdates.custom_address = event.custom_address;
    if (event.custom_lat !== undefined) eventUpdates.custom_lat = event.custom_lat;
    if (event.custom_lng !== undefined) eventUpdates.custom_lng = event.custom_lng;
    if (event.custom_city !== undefined) eventUpdates.custom_city = event.custom_city;
    if (event.custom_province !== undefined) eventUpdates.custom_province = event.custom_province;
    if (event.event_start_datetime) eventUpdates.event_start_datetime = event.event_start_datetime;
    if (event.event_end_datetime) eventUpdates.event_end_datetime = event.event_end_datetime;
    if (event.description_en) eventUpdates.description_en = event.description_en;
    if (event.description_nl) eventUpdates.description_nl = event.description_nl;
    if (event.age_min !== undefined) eventUpdates.age_min = event.age_min;
    if (event.age_max !== undefined) eventUpdates.age_max = event.age_max;
    if (event.price_min !== undefined) eventUpdates.price_min = event.price_min;
    if (event.price_max !== undefined) eventUpdates.price_max = event.price_max;
    if (event.is_free !== undefined) eventUpdates.is_free = event.is_free;
    if (event.is_indoor !== undefined) eventUpdates.is_indoor = event.is_indoor;
    if (event.is_outdoor !== undefined) eventUpdates.is_outdoor = event.is_outdoor;
    if (event.weather_dependent !== undefined) eventUpdates.weather_dependent = event.weather_dependent;
    if (event.booking_url !== undefined) eventUpdates.booking_url = event.booking_url;
    if (event.images) eventUpdates.images = event.images;
    if (event.is_featured !== undefined) eventUpdates.is_featured = event.is_featured;

    const { data, error } = await supabase
      .from('events')
      .update(eventUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (categoryIds !== undefined) {
      await this.unlinkAllCategories(id);
      if (categoryIds.length > 0) {
        await this.linkCategories(id, categoryIds);
      }
    }

    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async linkCategories(eventId: string, categoryIds: string[]) {
    const links = categoryIds.map(categoryId => ({
      event_id: eventId,
      category_id: categoryId,
    }));

    const { error } = await supabase
      .from('event_category_links')
      .insert(links);

    if (error) throw error;
  },

  async unlinkAllCategories(eventId: string) {
    const { error } = await supabase
      .from('event_category_links')
      .delete()
      .eq('event_id', eventId);

    if (error) throw error;
  },
};
