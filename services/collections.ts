import { supabase } from '@/lib/supabase';

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon: string;
  is_active: boolean;
  show_on_home?: boolean;
  sort_order: number;
}

export const collectionsService = {
  async getActiveCollections(): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('is_active', true)
      .eq('show_on_home', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching collections:', error);
      return [];
    }

    return data || [];
  },

  async getCollectionVenues(collectionId: string, limit: number = 10) {
    const { data: links, error: linksError } = await supabase
      .from('venue_collection_links')
      .select('venue_id')
      .eq('collection_id', collectionId);

    if (linksError || !links || links.length === 0) return [];

    const venueIds = links.map(link => link.venue_id);

    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .select(`
        *,
        place:places(*),
        categories:venue_category_links(category:activity_categories(*))
      `)
      .in('id', venueIds)
      .limit(limit);

    if (venuesError) {
      console.error('Error fetching venues:', venuesError);
      return [];
    }

    return venues || [];
  },

  async getCollectionEvents(collectionId: string, limit: number = 10) {
    const { data: links, error: linksError } = await supabase
      .from('event_collection_links')
      .select('event_id')
      .eq('collection_id', collectionId);

    if (linksError || !links || links.length === 0) return [];

    const eventIds = links.map(link => link.event_id);

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        *,
        place:places(*),
        categories:event_category_links(category:activity_categories(*))
      `)
      .in('id', eventIds)
      .limit(limit);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return [];
    }

    return events || [];
  },

  async getCollectionItems(collectionId: string, limit: number = 10) {
    const [venues, events] = await Promise.all([
      this.getCollectionVenues(collectionId, limit),
      this.getCollectionEvents(collectionId, limit)
    ]);

    return [...venues, ...events].slice(0, limit);
  }
};
