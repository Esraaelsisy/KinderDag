import { supabase } from '../lib/supabase';

export interface Banner {
  id: string;
  title_en: string;
  title_nl: string;
  subtitle_en: string;
  subtitle_nl: string;
  image_url: string;
  action_type: 'activity' | 'category' | 'url' | null;
  action_value: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BannerInput {
  title_en: string;
  title_nl: string;
  subtitle_en: string;
  subtitle_nl: string;
  image_url: string;
  action_type: 'activity' | 'category' | 'url' | null;
  action_value: string | null;
  is_active: boolean;
  sort_order: number;
}

export const adminBannersService = {
  async getAll(): Promise<Banner[]> {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Banner | null> {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(banner: BannerInput): Promise<Banner> {
    const { data, error } = await supabase
      .from('banners')
      .insert([banner])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, banner: Partial<BannerInput>): Promise<Banner> {
    const { data, error } = await supabase
      .from('banners')
      .update(banner)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getAllActivities(): Promise<Array<{ id: string; name: string }>> {
    const { data, error } = await supabase
      .from('activities')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getAllCategories(): Promise<Array<{ id: string; name_en: string; name_nl: string }>> {
    const { data, error } = await supabase
      .from('activity_categories')
      .select('id, name_en, name_nl')
      .order('name_en', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
