import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
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

const { width } = Dimensions.get('window');

interface Category {
  id: string;
  name_en: string;
  name_nl: string;
  color: string;
  icon?: string;
  sort_order: number;
}

export default function HomeScreen() {
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
      loadHappeningThisWeek(),
      loadAroundYou(),
      loadSeasonal(),
      loadQualityTime(),
      loadCategories(),
    ]);
    setLoading(false);
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

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('type', 'event')
        .gte('event_start_datetime', today.toISOString())
        .lte('event_start_datetime', nextWeek.toISOString())
        .order('event_start_datetime', { ascending: true })
        .limit(10);

      if (error) throw error;
      setHappeningThisWeek(data || []);
    } catch (error) {
      console.error('Error loading happening this week:', error);
    }
  };

  const loadAroundYou = async () => {
    try {
      if (!profile?.location_lat || !profile?.location_lng) {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('type', 'venue')
          .limit(10);

        if (error) throw error;
        setAroundYou(data || []);
        return;
      }

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('type', 'venue')
        .limit(10);

      if (error) throw error;

      const sorted = (data || []).sort((a, b) => {
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

      setAroundYou(sorted);
    } catch (error) {
      console.error('Error loading around you:', error);
    }
  };

  const loadSeasonal = async () => {
    try {
      const { data: tagsData } = await supabase
        .from('tags')
        .select('id')
        .in('slug', ['seasonal', 'sinterklaas', 'autumn', 'winter', 'spring', 'summer']);

      if (!tagsData || tagsData.length === 0) return;

      const tagIds = tagsData.map(t => t.id);

      const { data, error } = await supabase
        .from('activity_tags')
        .select('activity:activities(*)')
        .in('tag_id', tagIds)
        .limit(10);

      if (error) throw error;

      const activities = (data || [])
        .map((item: any) => item.activity)
        .filter(Boolean);

      setSeasonal(activities);
    } catch (error) {
      console.error('Error loading seasonal:', error);
    }
  };

  const loadQualityTime = async () => {
    try {
      const { data: tagsData } = await supabase
        .from('tags')
        .select('id')
        .in('slug', ['featured', 'hot-pick', 'dont-miss']);

      if (!tagsData || tagsData.length === 0) return;

      const tagIds = tagsData.map(t => t.id);

      const { data, error } = await supabase
        .from('activity_tags')
        .select('activity:activities(*)')
        .in('tag_id', tagIds)
        .limit(10);

      if (error) throw error;

      const activities = (data || [])
        .map((item: any) => item.activity)
        .filter(Boolean);

      setQualityTime(activities);
    } catch (error) {
      console.error('Error loading quality time:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .limit(20);

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
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
});
