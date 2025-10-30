import { supabase } from '../lib/supabase';

export interface Tag {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon: string;
  is_active: boolean;
  show_on_home?: boolean;
  sort_order: number;
}

export const adminTagsService = {
  /**
   * Get all collections with venue and event count
   */
  async getAll() {
    const { data: collections, error } = await supabase
      .from('collections')
      .select('*')
      .order('sort_order');

    if (error) throw error;
    if (!collections) return [];

    // Fetch venue and event links
    const { data: venueLinks } = await supabase
      .from('venue_collection_links')
      .select('*');

    const { data: eventLinks } = await supabase
      .from('event_collection_links')
      .select('*');

    const { data: allVenues } = await supabase
      .from('venues')
      .select('*');

    const { data: allEvents } = await supabase
      .from('events')
      .select('*');

    // Transform data to include venue and event count
    return collections.map(collection => {
      const vLinks = venueLinks
        ?.filter(link => link.collection_id === collection.id)
        .map(link => ({
          ...link,
          venue: allVenues?.find(v => v.id === link.venue_id)
        })) || [];

      const eLinks = eventLinks
        ?.filter(link => link.collection_id === collection.id)
        .map(link => ({
          ...link,
          event: allEvents?.find(e => e.id === link.event_id)
        })) || [];

      return {
        ...collection,
        venues: vLinks,
        events: eLinks,
        itemCount: vLinks.length + eLinks.length,
      };
    });
  },

  /**
   * Get single collection by ID
   */
  async getById(id: string) {
    const { data: collection, error } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!collection) return null;

    return collection;
  },

  /**
   * Create new collection
   */
  async create(collection: Tag) {
    const { data, error } = await supabase
      .from('collections')
      .insert([collection])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Bulk create collections
   */
  async bulkCreate(collections: Tag[]) {
    const { data, error } = await supabase
      .from('collections')
      .insert(collections)
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Update collection
   */
  async update(id: string, collection: Partial<Tag>) {
    const { data, error } = await supabase
      .from('collections')
      .update(collection)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Bulk update collections
   */
  async bulkUpdate(ids: string[], updates: Partial<Tag>) {
    const { data, error } = await supabase
      .from('collections')
      .update(updates)
      .in('id', ids)
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Delete collection
   */
  async delete(id: string) {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Bulk delete collections
   */
  async bulkDelete(ids: string[]) {
    const { error } = await supabase
      .from('collections')
      .delete()
      .in('id', ids);

    if (error) throw error;
  },

  /**
   * Update sort orders for multiple collections
   */
  async updateSortOrders(updates: { id: string; sort_order: number }[]) {
    for (const update of updates) {
      const { error } = await supabase
        .from('collections')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);

      if (error) throw error;
    }
  },
};
