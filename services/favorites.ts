import { supabase } from '@/lib/supabase';
import { Activity } from '@/types';

export const favoritesService = {
  /**
   * Get all favorite activities for a user
   */
  getAll: async (userId: string): Promise<Activity[]> => {
    const { data, error } = await supabase
      .from('favorites')
      .select('activity:activities(*)')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Extract activities from the nested structure
    return data?.map((item: any) => item.activity).filter(Boolean) || [];
  },

  /**
   * Check if an activity is favorited by user
   */
  isFavorited: async (userId: string, activityId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('profile_id', userId)
      .eq('activity_id', activityId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  /**
   * Add activity to favorites
   */
  add: async (userId: string, activityId: string): Promise<void> => {
    const { error } = await supabase.from('favorites').insert({
      profile_id: userId,
      activity_id: activityId,
    });

    if (error) throw error;
  },

  /**
   * Remove activity from favorites
   */
  remove: async (userId: string, activityId: string): Promise<void> => {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('profile_id', userId)
      .eq('activity_id', activityId);

    if (error) throw error;
  },

  /**
   * Toggle favorite status
   */
  toggle: async (userId: string, activityId: string): Promise<boolean> => {
    const isFav = await favoritesService.isFavorited(userId, activityId);

    if (isFav) {
      await favoritesService.remove(userId, activityId);
      return false;
    } else {
      await favoritesService.add(userId, activityId);
      return true;
    }
  },

  /**
   * Get favorite activity IDs for a user (useful for quick checks)
   */
  getFavoriteIds: async (userId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from('favorites')
      .select('activity_id')
      .eq('profile_id', userId);

    if (error) throw error;
    return data?.map((item) => item.activity_id) || [];
  },
};
