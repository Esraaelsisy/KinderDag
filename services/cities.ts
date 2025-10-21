import { supabase } from '@/lib/supabase';

export const citiesService = {
  /**
   * Get all unique cities from activities
   */
  getAll: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('activities')
      .select('city')
      .not('city', 'is', null)
      .order('city');

    if (error) throw error;

    // Extract unique cities
    const uniqueCities = [...new Set(data?.map((item) => item.city) || [])];
    return uniqueCities;
  },

  /**
   * Get coordinates for a city (uses first activity in that city)
   */
  getCityCoordinates: async (
    city: string
  ): Promise<{ lat: number; lng: number } | null> => {
    const { data, error } = await supabase
      .from('activities')
      .select('location_lat, location_lng')
      .eq('city', city)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      lat: data.location_lat,
      lng: data.location_lng,
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
