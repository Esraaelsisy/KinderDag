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
    const { data: categories, error } = await supabase
      .from('activity_categories')
      .select('id, name_en, name_nl, icon, color, sort_order, created_at')
      .order('sort_order');

    if (error) throw error;
    if (!categories) return [];

    // Fetch activity links
    const { data: activityLinks } = await supabase
      .from('activity_category_links')
      .select('*');

    const { data: allActivities } = await supabase
      .from('activities')
      .select('*');

    // Transform data to include activity count
    return categories.map(cat => {
      const links = activityLinks
        ?.filter(link => link.category_id === cat.id)
        .map(link => ({
          ...link,
          activity: allActivities?.find(act => act.id === link.activity_id)
        })) || [];
      return {
        ...cat,
        activities: links,
        activityCount: links.length,
      };
    });
  },

  /**
   * Get single category by ID
   */
  async getById(id: string) {
    const { data: category, error } = await supabase
      .from('activity_categories')
      .select('id, name_en, name_nl, icon, color, sort_order, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!category) return null;

    // Fetch activity links
    const { data: activityLinks } = await supabase
      .from('activity_category_links')
      .select('*')
      .eq('category_id', id);

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
      ...category,
      activities,
    };
  },

  /**
   * Create new category
   */
  async create(category: Category, activityIds: string[] = []) {
    const { data, error } = await supabase
      .from('activity_categories')
      .insert([category])
      .select('id, name_en, name_nl, icon, color, sort_order, created_at')
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
      .select('id, name_en, name_nl, icon, color, sort_order, created_at');

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
      .select('id, name_en, name_nl, icon, color, sort_order, created_at')
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
      .select('id, name_en, name_nl, icon, color, sort_order, created_at');

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
