import { supabase } from '../lib/supabase';

export interface Activity {
  id?: string;
  name: string;
  description_en: string;
  description_nl: string;
  location_lat: number;
  location_lng: number;
  address: string;
  city: string;
  province: string;
  age_min: number;
  age_max: number;
  price_min: number;
  price_max: number;
  is_free: boolean;
  is_indoor: boolean;
  is_outdoor: boolean;
  weather_dependent: boolean;
  phone?: string;
  email?: string;
  website?: string;
  booking_url?: string;
  images: string[];
  opening_hours: any;
  is_featured: boolean;
  is_seasonal: boolean;
  season_start?: string;
  season_end?: string;
  type?: 'event' | 'venue';
  event_start_datetime?: string;
  event_end_datetime?: string;
  venue_opening_hours?: {
    [day: string]: { open: string; close: string; closed?: boolean };
  };
}

export const adminActivitiesService = {
  /**
   * Get all activities with their categories and tags
   */
  async getAll() {
    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!activities) return [];

    // Fetch category links
    const { data: categoryLinks } = await supabase
      .from('activity_category_links')
      .select('activity_id, category:activity_categories(*)');

    // Fetch tag links
    const { data: tagLinks } = await supabase
      .from('activity_tag_links')
      .select('activity_id, tag:tags(*)');

    // Combine data
    return activities.map(activity => ({
      ...activity,
      categories: categoryLinks?.filter(link => link.activity_id === activity.id) || [],
      tags: tagLinks?.filter(link => link.activity_id === activity.id) || [],
    }));
  },

  /**
   * Get single activity by ID
   */
  async getById(id: string) {
    const { data: activity, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!activity) return null;

    // Fetch category links
    const { data: categoryLinks } = await supabase
      .from('activity_category_links')
      .select('activity_id, category:activity_categories(*)')
      .eq('activity_id', id);

    // Fetch tag links
    const { data: tagLinks } = await supabase
      .from('activity_tag_links')
      .select('activity_id, tag:tags(*)')
      .eq('activity_id', id);

    return {
      ...activity,
      categories: categoryLinks || [],
      tags: tagLinks || [],
    };
  },

  /**
   * Create new activity
   */
  async create(activity: Activity, categoryIds: string[] = [], tagIds: string[] = []) {
    const { data, error } = await supabase
      .from('activities')
      .insert([activity])
      .select()
      .single();

    if (error) throw error;

    // Link categories
    if (categoryIds.length > 0) {
      await this.linkCategories(data.id, categoryIds);
    }

    // Link tags
    if (tagIds.length > 0) {
      await this.linkTags(data.id, tagIds);
    }

    return data;
  },

  /**
   * Bulk create activities
   */
  async bulkCreate(activities: Activity[]) {
    const { data, error } = await supabase
      .from('activities')
      .insert(activities)
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Update activity
   */
  async update(id: string, activity: Partial<Activity>, categoryIds?: string[], tagIds?: string[]) {
    const { data, error } = await supabase
      .from('activities')
      .update(activity)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update categories if provided
    if (categoryIds !== undefined) {
      await this.unlinkAllCategories(id);
      if (categoryIds.length > 0) {
        await this.linkCategories(id, categoryIds);
      }
    }

    // Update tags if provided
    if (tagIds !== undefined) {
      await this.unlinkAllTags(id);
      if (tagIds.length > 0) {
        await this.linkTags(id, tagIds);
      }
    }

    return data;
  },

  /**
   * Bulk update activities
   */
  async bulkUpdate(ids: string[], updates: Partial<Activity>) {
    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .in('id', ids)
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Delete activity
   */
  async delete(id: string) {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Bulk delete activities
   */
  async bulkDelete(ids: string[]) {
    const { error } = await supabase
      .from('activities')
      .delete()
      .in('id', ids);

    if (error) throw error;
  },

  /**
   * Link categories to activity
   */
  async linkCategories(activityId: string, categoryIds: string[]) {
    const links = categoryIds.map(categoryId => ({
      activity_id: activityId,
      category_id: categoryId,
    }));

    const { error } = await supabase
      .from('activity_category_links')
      .insert(links);

    if (error) throw error;
  },

  /**
   * Unlink all categories from activity
   */
  async unlinkAllCategories(activityId: string) {
    const { error } = await supabase
      .from('activity_category_links')
      .delete()
      .eq('activity_id', activityId);

    if (error) throw error;
  },

  /**
   * Link tags to activity
   */
  async linkTags(activityId: string, tagIds: string[]) {
    const links = tagIds.map(tagId => ({
      activity_id: activityId,
      tag_id: tagId,
    }));

    const { error } = await supabase
      .from('activity_tag_links')
      .insert(links);

    if (error) throw error;
  },

  /**
   * Unlink all tags from activity
   */
  async unlinkAllTags(activityId: string) {
    const { error } = await supabase
      .from('activity_tag_links')
      .delete()
      .eq('activity_id', activityId);

    if (error) throw error;
  },
};
