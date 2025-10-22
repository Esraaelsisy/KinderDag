import { supabase } from '../lib/supabase';

export interface Category {
  id?: string;
  name_en: string;
  name_nl: string;
  icon: string;
  color: string;
  sort_order: number;
}

export const adminCategoriesService = {
  /**
   * Get all categories with activity count
   */
  async getAll() {
    const { data, error } = await supabase
      .from('activity_categories')
      .select(`
        *,
        activity_category_links(
          activity:activities(*)
        )
      `)
      .order('sort_order');

    if (error) throw error;

    // Transform data to include activity count
    return data?.map(cat => ({
      ...cat,
      activities: cat.activity_category_links,
      activityCount: cat.activity_category_links?.length || 0,
    }));
  },

  /**
   * Get single category by ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('activity_categories')
      .select(`
        *,
        activity_category_links(
          activity:activities(*)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    if (!data) return null;

    return {
      ...data,
      activities: data.activity_category_links,
    };
  },

  /**
   * Create new category
   */
  async create(category: Category, activityIds: string[] = []) {
    const { data, error } = await supabase
      .from('activity_categories')
      .insert([category])
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
   * Bulk create categories
   */
  async bulkCreate(categories: Category[]) {
    const { data, error } = await supabase
      .from('activity_categories')
      .insert(categories)
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Update category
   */
  async update(id: string, category: Partial<Category>, activityIds?: string[]) {
    const { data, error } = await supabase
      .from('activity_categories')
      .update(category)
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
   * Bulk update categories
   */
  async bulkUpdate(ids: string[], updates: Partial<Category>) {
    const { data, error } = await supabase
      .from('activity_categories')
      .update(updates)
      .in('id', ids)
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Delete category
   */
  async delete(id: string) {
    const { error } = await supabase
      .from('activity_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Bulk delete categories
   */
  async bulkDelete(ids: string[]) {
    const { error} = await supabase
      .from('activity_categories')
      .delete()
      .in('id', ids);

    if (error) throw error;
  },

  /**
   * Link activities to category
   */
  async linkActivities(categoryId: string, activityIds: string[]) {
    const links = activityIds.map(activityId => ({
      category_id: categoryId,
      activity_id: activityId,
    }));

    const { error } = await supabase
      .from('activity_category_links')
      .insert(links);

    if (error) throw error;
  },

  /**
   * Unlink all activities from category
   */
  async unlinkAllActivities(categoryId: string) {
    const { error } = await supabase
      .from('activity_category_links')
      .delete()
      .eq('category_id', categoryId);

    if (error) throw error;
  },

  /**
   * Update sort orders for multiple categories
   */
  async updateSortOrders(updates: { id: string; sort_order: number }[]) {
    for (const update of updates) {
      const { error } = await supabase
        .from('activity_categories')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);

      if (error) throw error;
    }
  },
};
