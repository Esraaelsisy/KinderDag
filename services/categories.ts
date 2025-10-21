import { supabase } from '@/lib/supabase';
import { Category } from '@/types';

export const categoriesService = {
  /**
   * Get all categories
   */
  getAll: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  /**
   * Get category by ID
   */
  getById: async (id: string): Promise<Category | null> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Get categories with activity count
   */
  getWithActivityCount: async (): Promise<
    (Category & { activityCount: number })[]
  > => {
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (catError) throw catError;

    const { data: activities, error: actError } = await supabase
      .from('activities')
      .select('category_id');

    if (actError) throw actError;

    // Count activities per category
    const counts = (activities || []).reduce(
      (acc, item) => {
        if (item.category_id) {
          acc[item.category_id] = (acc[item.category_id] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    // Add counts to categories
    return (categories || []).map((cat) => ({
      ...cat,
      activityCount: counts[cat.id] || 0,
    }));
  },
};
