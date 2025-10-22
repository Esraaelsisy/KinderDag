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
   * Get all tags with activity count
   */
  async getAll() {
    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .order('sort_order');

    if (error) throw error;
    if (!tags) return [];

    // Fetch activity links
    const { data: activityLinks } = await supabase
      .from('activity_tag_links')
      .select('*');

    const { data: allActivities } = await supabase
      .from('activities')
      .select('*');

    // Transform data to include activity count
    return tags.map(tag => {
      const links = activityLinks
        ?.filter(link => link.tag_id === tag.id)
        .map(link => ({
          ...link,
          activity: allActivities?.find(act => act.id === link.activity_id)
        })) || [];
      return {
        ...tag,
        activities: links,
        activityCount: links.length,
      };
    });
  },

  /**
   * Get single tag by ID
   */
  async getById(id: string) {
    const { data: tag, error } = await supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!tag) return null;

    // Fetch activity links
    const { data: activityLinks } = await supabase
      .from('activity_tag_links')
      .select('*')
      .eq('tag_id', id);

    let activities = [];
    if (activityLinks && activityLinks.length > 0) {
      const activityIds = activityLinks.map(link => link.activity_id);
      const { data: acts } = await supabase
        .from('activities')
        .select('*')
        .in('id', activityIds);

      activities = activityLinks.map(link => ({
        ...link,
        activity: acts?.find(act => act.id === link.activity_id)
      }));
    }

    return {
      ...tag,
      activities,
    };
  },

  /**
   * Create new tag
   */
  async create(tag: Tag, activityIds: string[] = []) {
    const { data, error } = await supabase
      .from('tags')
      .insert([tag])
      .select()
      .single();

    if (error) throw error;

    // Link activities
    if (activityIds.length > 0) {
      await this.linkActivities(data.id, activityIds);
    }

    return data;
  },

  /**
   * Bulk create tags
   */
  async bulkCreate(tags: Tag[]) {
    const { data, error } = await supabase
      .from('tags')
      .insert(tags)
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Update tag
   */
  async update(id: string, tag: Partial<Tag>, activityIds?: string[]) {
    const { data, error } = await supabase
      .from('tags')
      .update(tag)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update activities if provided
    if (activityIds !== undefined) {
      await this.unlinkAllActivities(id);
      if (activityIds.length > 0) {
        await this.linkActivities(id, activityIds);
      }
    }

    return data;
  },

  /**
   * Bulk update tags
   */
  async bulkUpdate(ids: string[], updates: Partial<Tag>) {
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .in('id', ids)
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Delete tag
   */
  async delete(id: string) {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Bulk delete tags
   */
  async bulkDelete(ids: string[]) {
    const { error } = await supabase
      .from('tags')
      .delete()
      .in('id', ids);

    if (error) throw error;
  },

  /**
   * Link activities to tag
   */
  async linkActivities(tagId: string, activityIds: string[]) {
    const links = activityIds.map(activityId => ({
      tag_id: tagId,
      activity_id: activityId,
    }));

    const { error } = await supabase
      .from('activity_tag_links')
      .insert(links);

    if (error) throw error;
  },

  /**
   * Unlink all activities from tag
   */
  async unlinkAllActivities(tagId: string) {
    const { error } = await supabase
      .from('activity_tag_links')
      .delete()
      .eq('tag_id', tagId);

    if (error) throw error;
  },

  /**
   * Update sort orders for multiple tags
   */
  async updateSortOrders(updates: { id: string; sort_order: number }[]) {
    for (const update of updates) {
      const { error } = await supabase
        .from('tags')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);

      if (error) throw error;
    }
  },
};
