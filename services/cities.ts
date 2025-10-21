import { supabase } from '@/lib/supabase';

export const citiesService = {
  /**
   * Get all cities from the cities table
   */
  getAll: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('cities')
      .select('name')
      .order('name');

    if (error) throw error;

    return data?.map((item) => item.name) || [];
  },

  /**
   * Get coordinates for a city from the cities table
   */
  getCityCoordinates: async (
    city: string
  ): Promise<{ lat: number; lng: number } | null> => {
    const { data, error } = await supabase
      .from('cities')
      .select('latitude, longitude')
      .eq('name', city)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      lat: data.latitude,
      lng: data.longitude,
    };
  },

  /**
   * Get activity count per city
   */
  getCitiesWithCount: async (): Promise<{ city: string; count: number }[]> => {
    const { data, error } = await supabase
      .from('activities')
      .select('city')
      .not('city', 'is', null);

    if (error) throw error;

    // Count activities per city
    const cityCounts = (data || []).reduce(
      (acc, item) => {
        acc[item.city] = (acc[item.city] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Convert to array and sort by count
    return Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count);
  },
};
