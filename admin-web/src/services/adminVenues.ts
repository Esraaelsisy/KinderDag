import { supabase } from '../lib/supabase';

export interface Venue {
  id?: string;
  place_id?: string;
  name: string;
  address: string;
  city: string;
  province: string;
  location_lat: number;
  location_lng: number;
  phone?: string;
  email?: string;
  website?: string;
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
  venue_opening_hours?: {
    [day: string]: { open: string; close: string; closed?: boolean };
  };
  is_featured: boolean;
  is_seasonal: boolean;
  season_start?: string;
  season_end?: string;
}

export const adminVenuesService = {
  async getAll() {
    const { data: venues, error } = await supabase
      .from('venues')
      .select(`
        *,
        place:places(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!venues) return [];

    const { data: categoryLinks } = await supabase
      .from('venue_category_links')
      .select('*');

    const { data: allCategories } = await supabase
      .from('activity_categories')
      .select('*');

    return venues.map(venue => ({
      ...venue,
      categories: categoryLinks
        ?.filter(link => link.venue_id === venue.id)
        .map(link => ({
          ...link,
          category: allCategories?.find(cat => cat.id === link.category_id)
        })) || [],
    }));
  },

  async getById(id: string) {
    const { data: venue, error } = await supabase
      .from('venues')
      .select(`
        *,
        place:places(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!venue) return null;

    const { data: categoryLinks } = await supabase
      .from('venue_category_links')
      .select('*')
      .eq('venue_id', id);

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
      ...venue,
      categories,
    };
  },

  async create(venue: Venue, categoryIds: string[] = []) {
    const { name, address, city, province, location_lat, location_lng, phone, email, website } = venue;

    const { data: place, error: placeError } = await supabase
      .from('places')
      .insert([{
        name,
        address,
        city,
        province,
        location_lat,
        location_lng,
        phone,
        email,
        website
      }])
      .select()
      .single();

    if (placeError) throw placeError;

    const { data, error } = await supabase
      .from('venues')
      .insert([{
        place_id: place.id,
        description_en: venue.description_en,
        description_nl: venue.description_nl,
        age_min: venue.age_min,
        age_max: venue.age_max,
        price_min: venue.price_min,
        price_max: venue.price_max,
        is_free: venue.is_free,
        is_indoor: venue.is_indoor,
        is_outdoor: venue.is_outdoor,
        weather_dependent: venue.weather_dependent,
        booking_url: venue.booking_url,
        images: venue.images,
        venue_opening_hours: venue.venue_opening_hours,
        is_featured: venue.is_featured,
        is_seasonal: venue.is_seasonal,
        season_start: venue.season_start,
        season_end: venue.season_end,
      }])
      .select()
      .single();

    if (error) throw error;

    if (categoryIds.length > 0) {
      await this.linkCategories(data.id, categoryIds);
    }

    return data;
  },

  async update(id: string, venue: Partial<Venue>, categoryIds?: string[]) {
    const venueData = await this.getById(id);
    if (!venueData) throw new Error('Venue not found');

    const { name, address, city, province, location_lat, location_lng, phone, email, website } = venue;

    if (name || address || city || province || location_lat || location_lng || phone || email || website) {
      const placeUpdates: any = {};
      if (name) placeUpdates.name = name;
      if (address) placeUpdates.address = address;
      if (city) placeUpdates.city = city;
      if (province) placeUpdates.province = province;
      if (location_lat) placeUpdates.location_lat = location_lat;
      if (location_lng) placeUpdates.location_lng = location_lng;
      if (phone !== undefined) placeUpdates.phone = phone;
      if (email !== undefined) placeUpdates.email = email;
      if (website !== undefined) placeUpdates.website = website;

      const { error: placeError } = await supabase
        .from('places')
        .update(placeUpdates)
        .eq('id', venueData.place.id);

      if (placeError) throw placeError;
    }

    const venueUpdates: any = {};
    if (venue.description_en) venueUpdates.description_en = venue.description_en;
    if (venue.description_nl) venueUpdates.description_nl = venue.description_nl;
    if (venue.age_min !== undefined) venueUpdates.age_min = venue.age_min;
    if (venue.age_max !== undefined) venueUpdates.age_max = venue.age_max;
    if (venue.price_min !== undefined) venueUpdates.price_min = venue.price_min;
    if (venue.price_max !== undefined) venueUpdates.price_max = venue.price_max;
    if (venue.is_free !== undefined) venueUpdates.is_free = venue.is_free;
    if (venue.is_indoor !== undefined) venueUpdates.is_indoor = venue.is_indoor;
    if (venue.is_outdoor !== undefined) venueUpdates.is_outdoor = venue.is_outdoor;
    if (venue.weather_dependent !== undefined) venueUpdates.weather_dependent = venue.weather_dependent;
    if (venue.booking_url !== undefined) venueUpdates.booking_url = venue.booking_url;
    if (venue.images) venueUpdates.images = venue.images;
    if (venue.venue_opening_hours) venueUpdates.venue_opening_hours = venue.venue_opening_hours;
    if (venue.is_featured !== undefined) venueUpdates.is_featured = venue.is_featured;
    if (venue.is_seasonal !== undefined) venueUpdates.is_seasonal = venue.is_seasonal;
    if (venue.season_start !== undefined) venueUpdates.season_start = venue.season_start;
    if (venue.season_end !== undefined) venueUpdates.season_end = venue.season_end;

    const { data, error } = await supabase
      .from('venues')
      .update(venueUpdates)
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
    const venueData = await this.getById(id);
    if (!venueData) throw new Error('Venue not found');

    const { error } = await supabase
      .from('venues')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await supabase
      .from('places')
      .delete()
      .eq('id', venueData.place.id);
  },

  async bulkDelete(ids: string[]) {
    const venues = await Promise.all(ids.map(id => this.getById(id)));
    const placeIds = venues.filter(v => v?.place?.id).map(v => v!.place.id);

    const { error } = await supabase
      .from('venues')
      .delete()
      .in('id', ids);

    if (error) throw error;

    if (placeIds.length > 0) {
      await supabase
        .from('places')
        .delete()
        .in('id', placeIds);
    }
  },

  async linkCategories(venueId: string, categoryIds: string[]) {
    const links = categoryIds.map(categoryId => ({
      venue_id: venueId,
      category_id: categoryId,
    }));

    const { error } = await supabase
      .from('venue_category_links')
      .insert(links);

    if (error) throw error;
  },

  async unlinkAllCategories(venueId: string) {
    const { error } = await supabase
      .from('venue_category_links')
      .delete()
      .eq('venue_id', venueId);

    if (error) throw error;
  },
};
