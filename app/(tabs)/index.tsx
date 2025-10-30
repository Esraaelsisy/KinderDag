import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import ActivityCard from '@/components/ActivityCard';
import SectionHeader from '@/components/SectionHeader';
import HorizontalCarousel from '@/components/HorizontalCarousel';
import CategoryChips from '@/components/CategoryChips';
import { Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Activity } from '@/types';
import { useRouter } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

interface Category {
  id: string;
  name_en: string;
  name_nl: string;
  color: string;
  icon?: string;
  sort_order: number;
}

interface Banner {
  id: string;
  title_en: string;
  title_nl: string;
  subtitle_en?: string;
  subtitle_nl?: string;
  image_url: string;
  action_type?: string;
  action_value?: string;
  sort_order: number;
}

export default function HomeScreen() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [happeningThisWeek, setHappeningThisWeek] = useState<Activity[]>([]);
  const [aroundYou, setAroundYou] = useState<Activity[]>([]);
  const [seasonal, setSeasonal] = useState<Activity[]>([]);
  const [qualityTime, setQualityTime] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const { profile } = useAuth();
  const { language, t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadBanners(),
      loadHappeningThisWeek(),
      loadAroundYou(),
      loadSeasonal(),
      loadQualityTime(),
      loadCategories(),
    ]);
    setLoading(false);
  };

  const loadBanners = async () => {
    try {
      const today = new Date().toISOString();
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', today)
        .gte('end_date', today)
        .order('sort_order', { ascending: true })
        .limit(5);

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error loading banners:', error);
      setBanners([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadHappeningThisWeek = async () => {
    try {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const { data: events, error } = await supabase
        .from('events')
        .select(`
          *,
          place:places!events_place_id_fkey(
            name,
            city,
            location_lat,
            location_lng
          )
        `)
        .gte('event_start_datetime', today.toISOString())
        .lte('event_start_datetime', nextWeek.toISOString())
        .order('event_start_datetime', { ascending: true })
        .limit(10);

      if (error) throw error;

      const transformed = (events || []).map((event: any) => ({
        id: event.id,
        name: event.place?.name || '',
        city: event.place?.city || '',
        location_lat: event.place?.location_lat || 0,
        location_lng: event.place?.location_lng || 0,
        images: event.images || [],
        description_en: event.description_en || '',
        description_nl: event.description_nl || '',
        age_min: event.age_min,
        age_max: event.age_max,
        price_min: event.price_min,
        price_max: event.price_max,
        is_free: event.is_free || false,
        average_rating: event.average_rating,
        total_reviews: event.total_reviews || 0,
        type: 'event',
        event_start_datetime: event.event_start_datetime,
        event_end_datetime: event.event_end_datetime,
      }));

      setHappeningThisWeek(transformed);
    } catch (error) {
      console.error('Error loading happening this week:', error);
      setHappeningThisWeek([]);
    }
  };

  const loadAroundYou = async () => {
    try {
      const { data: venues, error } = await supabase
        .from('venues')
        .select(`
          *,
          place:places!venues_place_id_fkey(
            name,
            city,
            location_lat,
            location_lng
          )
        `)
        .limit(20);

      if (error) throw error;

      let transformed = (venues || []).map((venue: any) => ({
        id: venue.id,
        name: venue.place?.name || '',
        city: venue.place?.city || '',
        location_lat: venue.place?.location_lat || 0,
        location_lng: venue.place?.location_lng || 0,
        images: venue.images || [],
        description_en: venue.description_en || '',
        description_nl: venue.description_nl || '',
        age_min: venue.age_min,
        age_max: venue.age_max,
        price_min: venue.price_min,
        price_max: venue.price_max,
        is_free: venue.is_free || false,
        average_rating: venue.average_rating,
        total_reviews: venue.total_reviews || 0,
        is_indoor: venue.is_indoor,
        is_outdoor: venue.is_outdoor,
        type: 'venue',
      }));

      if (profile?.location_lat && profile?.location_lng) {
        transformed = transformed.sort((a, b) => {
          const distA = calculateDistance(
            profile.location_lat!,
            profile.location_lng!,
            a.location_lat,
            a.location_lng
          );
          const distB = calculateDistance(
            profile.location_lat!,
            profile.location_lng!,
            b.location_lat,
            b.location_lng
          );
          return distA - distB;
        });
      }

      setAroundYou(transformed.slice(0, 10));
    } catch (error) {
      console.error('Error loading around you:', error);
      setAroundYou([]);
    }
  };

  const loadSeasonal = async () => {
    try {
      const { data: tagsData } = await supabase
        .from('tags')
        .select('id')
        .in('slug', ['seasonal', 'sinterklaas', 'autumn', 'winter', 'spring', 'summer']);

      if (!tagsData || tagsData.length === 0) {
        setSeasonal([]);
        return;
      }

      const tagIds = tagsData.map(t => t.id);

      const [venueLinks, eventLinks] = await Promise.all([
        supabase
          .from('venue_tag_links')
          .select(`
            venue:venues!venue_tag_links_venue_id_fkey(
              *,
              place:places!venues_place_id_fkey(name, city, location_lat, location_lng)
            )
          `)
          .in('tag_id', tagIds)
          .limit(5),
        supabase
          .from('event_tag_links')
          .select(`
            event:events!event_tag_links_event_id_fkey(
              *,
              place:places!events_place_id_fkey(name, city, location_lat, location_lng)
            )
          `)
          .in('tag_id', tagIds)
          .limit(5),
      ]);

      const venues = (venueLinks.data || [])
        .map((link: any) => link.venue)
        .filter(Boolean)
        .map((venue: any) => ({
          id: venue.id,
          name: venue.place?.name || '',
          city: venue.place?.city || '',
          location_lat: venue.place?.location_lat || 0,
          location_lng: venue.place?.location_lng || 0,
          images: venue.images || [],
          type: 'venue',
          age_min: venue.age_min,
          age_max: venue.age_max,
          price_min: venue.price_min,
          price_max: venue.price_max,
          is_free: venue.is_free || false,
          average_rating: venue.average_rating,
          total_reviews: venue.total_reviews || 0,
        }));

      const events = (eventLinks.data || [])
        .map((link: any) => link.event)
        .filter(Boolean)
        .map((event: any) => ({
          id: event.id,
          name: event.place?.name || '',
          city: event.place?.city || '',
          location_lat: event.place?.location_lat || 0,
          location_lng: event.place?.location_lng || 0,
          images: event.images || [],
          type: 'event',
          event_start_datetime: event.event_start_datetime,
          event_end_datetime: event.event_end_datetime,
          age_min: event.age_min,
          age_max: event.age_max,
          price_min: event.price_min,
          price_max: event.price_max,
          is_free: event.is_free || false,
          average_rating: event.average_rating,
          total_reviews: event.total_reviews || 0,
        }));

      setSeasonal([...venues, ...events]);
    } catch (error) {
      console.error('Error loading seasonal:', error);
      setSeasonal([]);
    }
  };

  const loadQualityTime = async () => {
    try {
      const { data: tagsData } = await supabase
        .from('tags')
        .select('id')
        .in('slug', ['featured', 'hot-pick', 'dont-miss']);

      if (!tagsData || tagsData.length === 0) {
        setQualityTime([]);
        return;
      }

      const tagIds = tagsData.map(t => t.id);

      const [venueLinks, eventLinks] = await Promise.all([
        supabase
          .from('venue_tag_links')
          .select(`
            venue:venues!venue_tag_links_venue_id_fkey(
              *,
              place:places!venues_place_id_fkey(name, city, location_lat, location_lng)
            )
          `)
          .in('tag_id', tagIds)
          .limit(5),
        supabase
          .from('event_tag_links')
          .select(`
            event:events!event_tag_links_event_id_fkey(
              *,
              place:places!events_place_id_fkey(name, city, location_lat, location_lng)
            )
          `)
          .in('tag_id', tagIds)
          .limit(5),
      ]);

      const venues = (venueLinks.data || [])
        .map((link: any) => link.venue)
        .filter(Boolean)
        .map((venue: any) => ({
          id: venue.id,
          name: venue.place?.name || '',
          city: venue.place?.city || '',
          location_lat: venue.place?.location_lat || 0,
          location_lng: venue.place?.location_lng || 0,
          images: venue.images || [],
          type: 'venue',
          age_min: venue.age_min,
          age_max: venue.age_max,
          price_min: venue.price_min,
          price_max: venue.price_max,
          is_free: venue.is_free || false,
          average_rating: venue.average_rating,
          total_reviews: venue.total_reviews || 0,
        }));

      const events = (eventLinks.data || [])
        .map((link: any) => link.event)
        .filter(Boolean)
        .map((event: any) => ({
          id: event.id,
          name: event.place?.name || '',
          city: event.place?.city || '',
          location_lat: event.place?.location_lat || 0,
          location_lng: event.place?.location_lng || 0,
          images: event.images || [],
          type: 'event',
          event_start_datetime: event.event_start_datetime,
          event_end_datetime: event.event_end_datetime,
          age_min: event.age_min,
          age_max: event.age_max,
          price_min: event.price_min,
          price_max: event.price_max,
          is_free: event.is_free || false,
          average_rating: event.average_rating,
          total_reviews: event.total_reviews || 0,
        }));

      setQualityTime([...venues, ...events]);
    } catch (error) {
      console.error('Error loading quality time:', error);
      setQualityTime([]);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .limit(20);

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
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

  const renderActivityCard = (activity: Activity, index: number) => {
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
        layout="vertical"
        type={activity.type as 'event' | 'venue'}
        eventStartDatetime={activity.event_start_datetime}
      />
    );
  };

  const handleCategorySelect = (category: Category) => {
    router.push({
      pathname: '/(tabs)/search',
      params: { categoryId: category.id },
    });
  };

  const handleBannerPress = (banner: Banner) => {
    if (!banner.action_type || !banner.action_value) {
      return;
    }

    switch (banner.action_type) {
      case 'category':
        router.push({
          pathname: '/(tabs)/search',
          params: { categoryId: banner.action_value },
        });
        break;

      case 'event':
        router.push(`/activity/${banner.action_value}?type=event` as any);
        break;

      case 'venue':
        router.push(`/activity/${banner.action_value}?type=venue` as any);
        break;

      case 'tab':
        const validTabs = ['events', 'venues', 'categories', 'search', 'favorites', 'profile'];
        if (validTabs.includes(banner.action_value)) {
          router.push(`/(tabs)/${banner.action_value}` as any);
        }
        break;

      case 'url':
        if (banner.action_value.startsWith('/')) {
          router.push(banner.action_value as any);
        }
        break;

      default:
        break;
    }
  };

  const showSeasonal = seasonal.length >= 5;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>
              {language === 'en' ? 'Hello' : 'Hallo'}
              {profile?.display_name && `, ${profile.display_name.split(' ')[0]}`}
            </Text>
            <Text style={styles.subtitle}>
              {language === 'en' ? 'Discover family fun today' : 'Ontdek familieplezier vandaag'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Search size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {banners.length > 0 && (
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            contentContainerStyle={styles.bannersContainer}
            style={styles.banners}
            onScroll={(event) => {
              const offsetX = event.nativeEvent.contentOffset.x;
              const index = Math.round(offsetX / screenWidth);
              setActiveBannerIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {banners.map((banner) => (
              <TouchableOpacity
                key={banner.id}
                style={styles.bannerCard}
                onPress={() => handleBannerPress(banner)}
              >
                <Image
                  source={{ uri: banner.image_url }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.bannerOverlay}
                >
                  <Text style={styles.bannerTitle}>
                    {language === 'en' ? banner.title_en : banner.title_nl}
                  </Text>
                  {(banner.subtitle_en || banner.subtitle_nl) && (
                    <Text style={styles.bannerSubtitle}>
                      {language === 'en' ? banner.subtitle_en : banner.subtitle_nl}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {banners.length > 1 && (
            <View style={styles.paginationDots}>
              {banners.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === activeBannerIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {happeningThisWeek.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            title={language === 'en' ? '🎉 Happening This Week' : '🎉 Deze week'}
            ctaLabel={language === 'en' ? 'View All' : 'Alles bekijken'}
            onPressCTA={() => router.push('/(tabs)/events')}
          />
          <HorizontalCarousel
            data={happeningThisWeek}
            renderItem={renderActivityCard}
            keyExtractor={(item) => item.id}
          />
        </View>
      )}

      {aroundYou.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            title={language === 'en' ? '📍 Around You' : '📍 In de buurt'}
            ctaLabel={language === 'en' ? 'View All' : 'Alles bekijken'}
            onPressCTA={() => router.push('/(tabs)/venues')}
          />
          <HorizontalCarousel
            data={aroundYou}
            renderItem={renderActivityCard}
            keyExtractor={(item) => item.id}
          />
        </View>
      )}

      {showSeasonal && (
        <View style={styles.section}>
          <SectionHeader
            title={language === 'en' ? '🍂 Seasonal Fun Has Started' : '🍂 Seizoensplezier begonnen'}
            ctaLabel={language === 'en' ? 'View All' : 'Alles bekijken'}
            onPressCTA={() => router.push('/(tabs)/search')}
          />
          <HorizontalCarousel
            data={seasonal}
            renderItem={renderActivityCard}
            keyExtractor={(item) => item.id}
          />
        </View>
      )}

      {qualityTime.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            title={language === 'en' ? '❤️ Quality Family Time' : '❤️ Quality time'}
            ctaLabel={language === 'en' ? 'View All' : 'Alles bekijken'}
            onPressCTA={() => router.push('/(tabs)/search')}
          />
          <HorizontalCarousel
            data={qualityTime}
            renderItem={renderActivityCard}
            keyExtractor={(item) => item.id}
          />
        </View>
      )}

      {categories.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            title={language === 'en' ? '🧩 Categories' : '🧩 Categorieën'}
          />
          <CategoryChips
            data={categories}
            onSelectCategory={handleCategorySelect}
            language={language}
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
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.white,
    opacity: 0.9,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: 24,
  },
  bottomPadding: {
    height: 40,
  },
  banners: {
    marginTop: 16,
  },
  bannersContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  bannerCard: {
    width: screenWidth - 40,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  bannerImage: {
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
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.lightGrey,
    opacity: 0.5,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: Colors.primary,
    opacity: 1,
  },
});
