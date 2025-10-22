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
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import ActivityCard from '@/components/ActivityCard';
import CategoryButton from '@/components/CategoryButton';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, ChevronDown, Navigation, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Activity } from '@/types';
import { activitiesService } from '@/services/activities';
import { citiesService } from '@/services/cities';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

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
  const [currentBanner, setCurrentBanner] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [tags, setTags] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [showCityModal, setShowCityModal] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryActivities, setCategoryActivities] = useState<Activity[]>([]);
  const bannerInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const { profile, updateProfile } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    loadData();
    loadCities();
    loadTags();
    if (profile?.location_name) {
      setSelectedCity(profile.location_name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity]);

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
    try {
      let data = await activitiesService.getFeatured(10);
      if (selectedCity) {
        data = data.filter(activity => activity.city === selectedCity);
      }
      setFeatured(data);
    } catch (error) {
      console.error('Failed to load featured activities:', error);
    }
  };

  const loadSeasonal = async () => {
    const today = new Date().toISOString().split('T')[0];
    let query = supabase
      .from('activities')
      .select('*')
      .eq('is_seasonal', true)
      .lte('season_start', today)
      .gte('season_end', today);

    if (selectedCity) {
      query = query.eq('city', selectedCity);
    }

    const { data } = await query
      .order('average_rating', { ascending: false })
      .limit(10);

    if (data) setSeasonal(data);
  };

  const loadDontMiss = async () => {
    let query = supabase
      .from('activities')
      .select('*')
      .eq('is_featured', true);

    if (selectedCity) {
      query = query.eq('city', selectedCity);
    }

    const { data } = await query
      .order('average_rating', { ascending: false })
      .limit(5);

    if (data) setDontMiss(data);
  };

  const loadCatchItBeforeEnds = async () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    let query = supabase
      .from('activities')
      .select('*')
      .eq('is_seasonal', true)
      .lte('season_end', nextWeek.toISOString().split('T')[0])
      .gte('season_end', today.toISOString().split('T')[0]);

    if (selectedCity) {
      query = query.eq('city', selectedCity);
    }

    const { data } = await query
      .order('season_end', { ascending: true })
      .limit(10);

    if (data) setCatchItBeforeEnds(data);
  };

  const loadHotPicks = async () => {
    let query = supabase
      .from('activities')
      .select('*')
      .gte('average_rating', 4.0);

    if (selectedCity) {
      query = query.eq('city', selectedCity);
    }

    const { data } = await query
      .order('total_reviews', { ascending: false })
      .limit(10);

    if (data) setHotPicks(data);
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from('activity_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .limit(8);

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

  const loadCities = async () => {
    try {
      const data = await citiesService.getAll();
      setCities(data);
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('id, name, slug')
        .eq('is_active', true);

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const loadCategoryActivities = async (categoryId: string) => {
    try {
      const { data: activityLinks, error } = await supabase
        .from('activity_category_links')
        .select('activity_id')
        .eq('category_id', categoryId)
        .limit(5);

      if (error) throw error;

      if (activityLinks && activityLinks.length > 0) {
        const activityIds = activityLinks.map(link => link.activity_id);
        const activities = await activitiesService.getByIds(activityIds);
        setCategoryActivities(activities.slice(0, 5));
      } else {
        setCategoryActivities([]);
      }
    } catch (error) {
      console.error('Failed to load category activities:', error);
      setCategoryActivities([]);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const hasPermission = await requestLocationPermission();

      if (!hasPermission) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions in your device settings to use this feature.',
          [{ text: 'OK' }]
        );
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const city = reverseGeocode[0].city || reverseGeocode[0].subregion || 'Unknown';

        if (profile?.id) {
          await updateProfile({
            location_name: city,
            location_lat: latitude,
            location_lng: longitude,
          });
        }

        setSelectedCity(city);
        setShowCityModal(false);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please try again or select a city manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const selectCity = async (city: string) => {
    setSelectedCity(city);

    try {
      const coords = await citiesService.getCityCoordinates(city);

      if (profile?.id && coords) {
        await updateProfile({
          location_name: city,
          location_lat: coords.lat,
          location_lng: coords.lng,
        });
      }
      setShowCityModal(false);
    } catch (error) {
      console.error('Failed to update city:', error);
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
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              {language === 'en' ? 'Hello' : 'Hallo'}, {profile?.full_name?.split(' ')[0] || 'there'}!
            </Text>
            <TouchableOpacity
              style={styles.citySelector}
              onPress={() => setShowCityModal(true)}
            >
              <MapPin size={16} color={Colors.white} />
              <Text style={styles.cityText}>
                {selectedCity || profile?.location_name || (language === 'en' ? 'Select City' : 'Selecteer Stad')}
              </Text>
              <ChevronDown size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <Modal
        visible={showCityModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCityModal(false)}
      >
        <View style={styles.cityModalOverlay}>
          <View style={styles.cityModalContent}>
            <View style={styles.cityModalHeader}>
              <Text style={styles.cityModalTitle}>
                {language === 'en' ? 'Select City' : 'Selecteer Stad'}
              </Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <X size={24} color={Colors.textDark} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={getCurrentLocation}
              disabled={isLoadingLocation}
            >
              <View style={styles.currentLocationIcon}>
                <Navigation size={20} color={Colors.white} />
              </View>
              <Text style={styles.currentLocationText}>
                {isLoadingLocation
                  ? (language === 'en' ? 'Getting location...' : 'Locatie ophalen...')
                  : (language === 'en' ? 'Use Current Location' : 'Gebruik Huidige Locatie')}
              </Text>
            </TouchableOpacity>

            <View style={styles.cityDivider}>
              <View style={styles.cityDividerLine} />
              <Text style={styles.cityDividerText}>
                {language === 'en' ? 'OR SELECT A CITY' : 'OF SELECTEER EEN STAD'}
              </Text>
              <View style={styles.cityDividerLine} />
            </View>

            <ScrollView style={styles.citiesList} showsVerticalScrollIndicator={false}>
              {cities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.cityItem,
                    selectedCity === city && styles.cityItemActive,
                  ]}
                  onPress={() => selectCity(city)}
                >
                  <Text style={[
                    styles.cityItemText,
                    selectedCity === city && styles.cityItemTextActive,
                  ]}>
                    {city}
                  </Text>
                  {selectedCity === city && (
                    <Text style={styles.cityCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/categories')}>
            <Text style={styles.seeAllLink}>
              {language === 'en' ? 'See All' : 'Bekijk Alles'}
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          {categories.map((category) => {
            const categoryEmojis: Record<string, string> = {
              'spring fun': '🌸',
              'autumn fun': '🍂',
              'loyalty program': '⭐',
              'wednesday pass': '📅',
              'exclusively on kidzapp': '💎',
              'certified autism centers': '🤝',
              'afterschool activities': '🎒',
              'animal fun': '🐾',
              'art, music & dance': '🎨',
              'baby & toddler': '👶',
              'birthdays': '🎂',
              'courses, camps & workshops': '📚',
              'eat out': '🍽️',
              'explore the city': '🗺️',
              'free for people of determination': '💚',
              'fun & play': '🎮',
              'markets & fairs': '🎪',
              'outdoor & nature': '🌳',
              'parent zone': '👨‍👩‍👧',
              'schools & nurseries': '🏫',
              'shows & cinema': '🎬',
              'sports & active': '⚽',
              'theme parks': '🎢',
              'water fun': '💦',
              'fun at home': '🏠',
              'teens': '🎧',
            };
            const emoji = categoryEmojis[category.name_en.toLowerCase()] || '🎯';

            return (
              <CategoryButton
                key={category.id}
                nameEn={category.name_en}
                nameNl={category.name_nl}
                color={category.color}
                emoji={emoji}
                isActive={selectedCategoryId === category.id}
                onPress={() => {
                  if (selectedCategoryId === category.id) {
                    setSelectedCategoryId(null);
                    setCategoryActivities([]);
                  } else {
                    setSelectedCategoryId(category.id);
                    loadCategoryActivities(category.id);
                  }
                }}
              />
            );
          })}
        </ScrollView>
      </View>

      {selectedCategoryId && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {language === 'en'
                ? categories.find(c => c.id === selectedCategoryId)?.name_en
                : categories.find(c => c.id === selectedCategoryId)?.name_nl}
            </Text>
            {categoryActivities.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
                  if (selectedCategory) {
                    router.push({
                      pathname: '/(tabs)/discover',
                      params: {
                        categoryId: selectedCategory.id,
                        categoryName: language === 'en' ? selectedCategory.name_en : selectedCategory.name_nl
                      }
                    });
                  }
                }}
              >
                <Text style={styles.seeAllLink}>
                  {language === 'en' ? 'See More' : 'Bekijk Meer'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {categoryActivities.length > 0 ? (
            <FlatList
              data={categoryActivities}
              renderItem={({ item }) => renderActivity(item)}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activitiesList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {language === 'en'
                  ? 'No activities for your city added yet. Stay tuned!'
                  : 'Nog geen activiteiten voor jouw stad toegevoegd. Blijf op de hoogte!'}
              </Text>
            </View>
          )}
        </View>
      )}

      {dontMiss.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {language === 'en' ? "Don't miss this week" : 'Mis deze week niet'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const tag = tags.find(t => t.slug === 'dont-miss');
                if (tag) {
                  router.push({
                    pathname: '/(tabs)/discover',
                    params: { tagId: tag.id, tagName: tag.name }
                  });
                }
              }}
            >
              <Text style={styles.seeAllLink}>
                {language === 'en' ? 'See All' : 'Bekijk Alles'}
              </Text>
            </TouchableOpacity>
          </View>
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {language === 'en' ? 'Catch it before it Ends' : 'Grijp het voordat het eindigt'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const tag = tags.find(t => t.slug === 'ending-soon');
                if (tag) {
                  router.push({
                    pathname: '/(tabs)/discover',
                    params: { tagId: tag.id, tagName: tag.name }
                  });
                }
              }}
            >
              <Text style={styles.seeAllLink}>
                {language === 'en' ? 'See All' : 'Bekijk Alles'}
              </Text>
            </TouchableOpacity>
          </View>
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {language === 'en' ? 'Hot Picks' : 'Populaire keuzes'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const tag = tags.find(t => t.slug === 'hot-pick');
                if (tag) {
                  router.push({
                    pathname: '/(tabs)/discover',
                    params: { tagId: tag.id, tagName: tag.name }
                  });
                }
              }}
            >
              <Text style={styles.seeAllLink}>
                {language === 'en' ? 'See All' : 'Bekijk Alles'}
              </Text>
            </TouchableOpacity>
          </View>
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.featured')}</Text>
            <TouchableOpacity
              onPress={() => {
                router.push('/(tabs)/discover');
              }}
            >
              <Text style={styles.seeAllLink}>
                {language === 'en' ? 'See All' : 'Bekijk Alles'}
              </Text>
            </TouchableOpacity>
          </View>
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.seasonal')}</Text>
            <TouchableOpacity
              onPress={() => {
                const tag = tags.find(t => t.slug === 'seasonal');
                if (tag) {
                  router.push({
                    pathname: '/(tabs)/discover',
                    params: { tagId: tag.id, tagName: tag.name }
                  });
                }
              }}
            >
              <Text style={styles.seeAllLink}>
                {language === 'en' ? 'See All' : 'Bekijk Alles'}
              </Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: Colors.background,
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
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  cityText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  location: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  cityModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  cityModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  cityModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cityModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    gap: 12,
  },
  currentLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
  },
  cityDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  cityDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  cityDividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
    paddingHorizontal: 12,
  },
  citiesList: {
    maxHeight: 400,
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cityItemActive: {
    backgroundColor: Colors.secondaryLight,
  },
  cityItemText: {
    fontSize: 16,
    color: Colors.textDark,
  },
  cityItemTextActive: {
    fontWeight: '600',
    color: Colors.secondary,
  },
  cityCheckmark: {
    fontSize: 18,
    color: Colors.secondary,
    fontWeight: 'bold',
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
    color: Colors.white,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: Colors.white,
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
    backgroundColor: Colors.white,
  },
  categoriesSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  seeAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
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
  emptyState: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 100,
  },
});
