import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import ActivityCard from '@/components/ActivityCard';
import CategoryButton from '@/components/CategoryButton';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Activity {
  id: string;
  name: string;
  city: string;
  images: string[];
  average_rating: number;
  total_reviews: number;
  price_min: number;
  price_max: number;
  is_free: boolean;
  age_min: number;
  age_max: number;
  location_lat: number;
  location_lng: number;
}

interface Category {
  id: string;
  name_en: string;
  name_nl: string;
  color: string;
  sort_order: number;
}

interface Banner {
  id: string;
  title_en: string;
  title_nl: string;
  subtitle_en: string;
  subtitle_nl: string;
  image_url: string;
}

export default function HomeScreen() {
  const [featured, setFeatured] = useState<Activity[]>([]);
  const [seasonal, setSeasonal] = useState<Activity[]>([]);
  const [dontMiss, setDontMiss] = useState<Activity[]>([]);
  const [catchItBeforeEnds, setCatchItBeforeEnds] = useState<Activity[]>([]);
  const [hotPicks, setHotPicks] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryActivities, setCategoryActivities] = useState<Activity[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const bannerInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const { profile } = useAuth();
  const { t, language } = useLanguage();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      bannerInterval.current = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      }, 3000);
    }
    return () => {
      if (bannerInterval.current) {
        clearInterval(bannerInterval.current);
      }
    };
  }, [banners.length]);

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryActivities(selectedCategory);
    }
  }, [selectedCategory]);

  const loadData = async () => {
    await Promise.all([
      loadFeatured(),
      loadSeasonal(),
      loadDontMiss(),
      loadCatchItBeforeEnds(),
      loadHotPicks(),
      loadCategories(),
      loadBanners(),
    ]);
  };

  const loadFeatured = async () => {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('is_featured', true)
      .order('average_rating', { ascending: false })
      .limit(10);

    if (data) setFeatured(data);
  };

  const loadSeasonal = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('is_seasonal', true)
      .lte('season_start', today)
      .gte('season_end', today)
      .order('average_rating', { ascending: false })
      .limit(10);

    if (data) setSeasonal(data);
  };

  const loadDontMiss = async () => {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('is_featured', true)
      .order('average_rating', { ascending: false })
      .limit(10);

    if (data) setDontMiss(data);
  };

  const loadCatchItBeforeEnds = async () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('is_seasonal', true)
      .lte('season_end', nextWeek.toISOString().split('T')[0])
      .gte('season_end', today.toISOString().split('T')[0])
      .order('season_end', { ascending: true })
      .limit(10);

    if (data) setCatchItBeforeEnds(data);
  };

  const loadHotPicks = async () => {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .gte('average_rating', 4.0)
      .order('total_reviews', { ascending: false })
      .limit(10);

    if (data) setHotPicks(data);
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from('activity_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (data) setCategories(data);
  };

  const loadBanners = async () => {
    const { data } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(5);

    if (data) setBanners(data);
  };

  const loadCategoryActivities = async (categoryId: string) => {
    const { data } = await supabase
      .from('activity_category_links')
      .select('activity_id, activities(*)')
      .eq('category_id', categoryId)
      .limit(10);

    if (data) {
      const activities = data
        .map((item: any) => item.activities)
        .filter(Boolean);
      setCategoryActivities(activities);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const renderActivity = (activity: Activity) => {
    let distance: number | undefined;
    if (profile?.location_lat && profile?.location_lng) {
      distance = calculateDistance(
        profile.location_lat,
        profile.location_lng,
        activity.location_lat,
        activity.location_lng
      );
    }

    return (
      <ActivityCard
        key={activity.id}
        id={activity.id}
        name={activity.name}
        city={activity.city}
        distance={distance}
        image={activity.images?.[0] || 'https://images.pexels.com/photos/1648387/pexels-photo-1648387.jpeg'}
        rating={activity.average_rating}
        reviews={activity.total_reviews}
        priceMin={activity.price_min}
        priceMax={activity.price_max}
        isFree={activity.is_free}
        ageMin={activity.age_min}
        ageMax={activity.age_max}
      />
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <LinearGradient colors={['#10B981', '#059669']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>
              {language === 'en' ? 'Hello' : 'Hallo'}, {profile?.full_name?.split(' ')[0] || 'there'}!
            </Text>
            {profile?.location_name && (
              <View style={styles.locationRow}>
                <MapPin size={16} color="#ffffff" />
                <Text style={styles.location}>{profile.location_name}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      {banners.length > 0 && (
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: banners[currentBanner].image_url }}
            style={styles.banner}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.bannerOverlay}
          >
            <Text style={styles.bannerTitle}>
              {language === 'en'
                ? banners[currentBanner].title_en
                : banners[currentBanner].title_nl}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {language === 'en'
                ? banners[currentBanner].subtitle_en
                : banners[currentBanner].subtitle_nl}
            </Text>
          </LinearGradient>
          <View style={styles.bannerDots}>
            {banners.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.bannerDot,
                  index === currentBanner && styles.bannerDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      )}

      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          {categories.map((category) => {
            const categoryEmojis: Record<string, string> = {
              'outdoor': '🏞️',
              'indoor': '🏠',
              'sports': '⚽',
              'arts': '🎨',
              'learning': '📚',
              'adventure': '🧗',
            };
            const emoji = categoryEmojis[category.name_en.toLowerCase()] || '🎯';

            return (
              <CategoryButton
                key={category.id}
                nameEn={category.name_en}
                nameNl={category.name_nl}
                color={category.color}
                emoji={emoji}
                isActive={selectedCategory === category.id}
                onPress={() =>
                  setSelectedCategory(selectedCategory === category.id ? null : category.id)
                }
              />
            );
          })}
        </ScrollView>
      </View>

      {selectedCategory && categoryActivities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {categories.find((c) => c.id === selectedCategory)?.[
              language === 'en' ? 'name_en' : 'name_nl'
            ]}
          </Text>
          <FlatList
            data={categoryActivities}
            renderItem={({ item }) => renderActivity(item)}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activitiesList}
          />
        </View>
      )}

      {dontMiss.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? "Don't miss this week" : 'Mis deze week niet'}
          </Text>
          <FlatList
            data={dontMiss}
            renderItem={({ item }) => renderActivity(item)}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activitiesList}
          />
        </View>
      )}

      {catchItBeforeEnds.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Catch it before it Ends' : 'Grijp het voordat het eindigt'}
          </Text>
          <FlatList
            data={catchItBeforeEnds}
            renderItem={({ item }) => renderActivity(item)}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activitiesList}
          />
        </View>
      )}

      {hotPicks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {language === 'en' ? 'Hot Picks' : 'Populaire keuzes'}
          </Text>
          <FlatList
            data={hotPicks}
            renderItem={({ item }) => renderActivity(item)}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activitiesList}
          />
        </View>
      )}

      {featured.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.featured')}</Text>
          <FlatList
            data={featured}
            renderItem={({ item }) => renderActivity(item)}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activitiesList}
          />
        </View>
      )}

      {seasonal.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.seasonal')}</Text>
          <FlatList
            data={seasonal}
            renderItem={({ item }) => renderActivity(item)}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activitiesList}
          />
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  location: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  bannerContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    height: 180,
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  bannerDots: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  bannerDotActive: {
    backgroundColor: '#ffffff',
  },
  categoriesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  activitiesList: {
    paddingHorizontal: 20,
  },
  bottomPadding: {
    height: 100,
  },
});
