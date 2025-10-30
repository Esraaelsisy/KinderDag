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
import { MapPin, ChevronDown, Navigation, X, ArrowRight, Search } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Activity } from '@/types';
import { activitiesService } from '@/services/activities';
import { citiesService } from '@/services/cities';
import { collectionsService } from '@/services/collections';
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
  action_type: string | null;
  action_value: string | null;
}

interface CollectionWithItems {
  id: string;
  name: string;
  slug: string;
  color: string;
  sort_order: number;
  items: Activity[];
}

export default function HomeScreen() {
  const [collections, setCollections] = useState<CollectionWithItems[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryActivities, setCategoryActivities] = useState<Activity[]>([]);
  const bannerInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const categoriesFlatListRef = useRef<FlatList>(null);
  const { profile, updateProfile } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    loadData();
    loadCities();
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
      loadCollections(),
      loadCategories(),
      loadBanners(),
    ]);
  };

  const loadCollections = async () => {
    try {
      const activeCollections = await collectionsService.getActiveCollections();

      const collectionsWithItems = await Promise.all(
        activeCollections.map(async (collection) => {
          const items = await collectionsService.getCollectionItems(collection.id, 10);

          let filteredItems = items;
          if (selectedCity) {
            filteredItems = items.filter((item: any) => item.city === selectedCity);
          }

          return {
            id: collection.id,
            name: collection.name,
            slug: collection.slug,
            color: collection.color,
            sort_order: collection.sort_order,
            items: filteredItems,
          };
        })
      );

      const sorted = collectionsWithItems.sort((a, b) => a.sort_order - b.sort_order);
      setCollections(sorted);
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from('activity_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .limit(8);

    if (data) {
      setCategories(data);
      if (data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(data[0].id);
        loadCategoryActivities(data[0].id);
      }
    }
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
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Search size={20} color={Colors.white} />
          </TouchableOpacity>
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
        <TouchableOpacity
          style={styles.bannerContainer}
          activeOpacity={0.9}
          onPress={() => {
            const banner = banners[currentBanner];
            if (banner.action_type && banner.action_value) {
              if (banner.action_type === 'activity') {
                router.push(`/activity/${banner.action_value}`);
              } else if (banner.action_type === 'category') {
                const category = categories.find(c => c.id === banner.action_value);
                if (category) {
                  router.push({
                    pathname: '/(tabs)/discover',
                    params: {
                      categoryId: category.id,
                      categoryName: language === 'en' ? category.name_en : category.name_nl
                    }
                  });
                }
              } else if (banner.action_type === 'url' && banner.action_value) {
                // For external URLs, you might want to use Linking.openURL
                // For now, just navigate to discover page
                router.push('/(tabs)/discover');
              }
            }
          }}
        >
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
        </TouchableOpacity>
      )}

      {collections.map((collection) => (
        collection.items.length > 0 && (
          <View key={collection.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{collection.name}</Text>
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/discover',
                    params: { collectionId: collection.id, collectionName: collection.name }
                  });
                }}
              >
                <Text style={styles.seeAllLink}>
                  {language === 'en' ? 'See All' : 'Bekijk Alles'}
                </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={collection.items}
              renderItem={({ item }) => renderActivity(item)}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activitiesList}
            />
          </View>
        )
      ))}

      <View style={styles.categoriesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/categories')}>
            <Text style={styles.seeAllLink}>
              {language === 'en' ? 'See All' : 'Bekijk Alles'}
            </Text>
          </TouchableOpacity>
        </View>
        <FlatList
          ref={categoriesFlatListRef}
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          keyExtractor={(item) => item.id}
          renderItem={({ item: category, index }) => {
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

                    setTimeout(() => {
                      categoriesFlatListRef.current?.scrollToIndex({
                        index,
                        animated: true,
                        viewPosition: 0.5,
                      });
                    }, 100);
                  }
                }}
              />
            );
          }}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              categoriesFlatListRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: true,
              });
            }, 100);
          }}
        />

        {selectedCategoryId && (
        <View style={styles.categoryActivitiesContainer}>
          <View style={styles.bubblePointer} />
          {categoryActivities.length > 0 ? (
            <>
              <FlatList
                data={categoryActivities}
                renderItem={({ item }) => renderActivity(item)}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryActivitiesList}
              />
              <TouchableOpacity
                style={styles.seeMoreButton}
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
                <Text style={styles.seeMoreText}>
                  {language === 'en' ? 'See More' : 'Bekijk Meer'}
                </Text>
                <ArrowRight size={18} color={Colors.secondary} strokeWidth={2.5} />
              </TouchableOpacity>
            </>
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
      </View>

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
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 8,
  },
  categoryActivitiesContainer: {
    backgroundColor: '#FFF9E6',
    paddingTop: 16,
    paddingBottom: 20,
    marginBottom: 8,
  },
  bubblePointer: {
    display: 'none',
  },
  categoryActivitiesList: {
    paddingLeft: 20,
    marginBottom: 16,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 6,
  },
  seeMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
  },
  section: {
    marginBottom: 24,
  },
  activitiesList: {
    paddingHorizontal: 20,
  },
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});
