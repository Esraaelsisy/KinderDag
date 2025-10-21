import { supabase } from '@/lib/supabase';
import { Activity, ActivityFilters } from '@/types';
import { calculateDistance } from '@/utils/location';

export const activitiesService = {
  /**
   * Get all activities ordered by rating
   */
  getAll: async (): Promise<Activity[]> => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('average_rating', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get featured activities for homepage
   */
  getFeatured: async (limit = 10): Promise<Activity[]> => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('is_featured', true)
      .order('average_rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get activities by category
   */
  getByCategory: async (categoryId: string): Promise<Activity[]> => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('category_id', categoryId)
      .order('average_rating', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get activity by ID
   */
  getById: async (id: string): Promise<Activity | null> => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Search activities by query
   */
  search: async (query: string): Promise<Activity[]> => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
      .order('average_rating', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Filter activities based on multiple criteria
   */
  filterActivities: (
    activities: Activity[],
    filters: ActivityFilters,
    userLat?: number,
    userLng?: number
  ): Activity[] => {
    let filtered = [...activities];

    // Indoor/Outdoor filter
    if (filters.indoor && !filters.outdoor) {
      filtered = filtered.filter((a) => a.is_indoor);
    } else if (filters.outdoor && !filters.indoor) {
      filtered = filtered.filter((a) => a.is_outdoor);
    }

    // Free activities filter
    if (filters.free) {
      filtered = filtered.filter((a) => a.is_free);
    }

    // Age range filter
    if (filters.minAge && filters.minAge !== '0') {
      const minAge = parseInt(filters.minAge);
      filtered = filtered.filter((a) => a.age_max >= minAge);
    }
    if (filters.maxAge && filters.maxAge !== '12') {
      const maxAge = parseInt(filters.maxAge);
      filtered = filtered.filter((a) => a.age_min <= maxAge);
    }

    // Distance filter
    if (filters.maxDistance && userLat && userLng) {
      const maxDist = parseFloat(filters.maxDistance);
      filtered = filtered.filter((a) => {
        const distance = calculateDistance(
          userLat,
          userLng,
          a.location_lat,
          a.location_lng
        );
        return distance <= maxDist;
      });
    }

    // Category filter
    if (filters.categoryId) {
      filtered = filtered.filter((a) => a.category_id === filters.categoryId);
    }

    return filtered;
  },

  /**
   * Sort activities by distance from user location
   */
  sortByDistance: (
    activities: Activity[],
    userLat: number,
    userLng: number
  ): Activity[] => {
    return activities.sort((a, b) => {
      const distA = calculateDistance(userLat, userLng, a.location_lat, a.location_lng);
      const distB = calculateDistance(userLat, userLng, b.location_lat, b.location_lng);
      return distA - distB;
    });
  },

  /**
   * Get activities with calculated distance from user
   */
  getWithDistance: (
    activities: Activity[],
    userLat: number,
    userLng: number
  ): (Activity & { distance: number })[] => {
    return activities.map((activity) => ({
      ...activity,
      distance: calculateDistance(
        userLat,
        userLng,
        activity.location_lat,
        activity.location_lng
      ),
    }));
  },
};
