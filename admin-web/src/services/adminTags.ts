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
    const { data, error } = await supabase
      .from('tags')
      .select(`
        *,
        activities:activity_tag_links(activity:activities(*))
      `)
      .order('sort_order');

    if (error) throw error;

    // Transform data to include activity count
    return data?.map(tag => ({
      ...tag,
      activityCount: tag.activities?.length || 0,
    }));
  },

  /**
   * Get single tag by ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('tags')
      .select(`
        *,
        activities:activity_tag_links(activity:activities(*))
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
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
