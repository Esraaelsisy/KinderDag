import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Linking,
  Modal,
} from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import ActivityCard from '@/components/ActivityCard';
import { Search, SlidersHorizontal, X, List, MapPin as MapPinIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Activity } from '@/types';
import { activitiesService } from '@/services/activities';
import { citiesService } from '@/services/cities';
import { calculateDistance } from '@/utils/location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function DiscoverScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const categoryId = params.categoryId as string | undefined;
  const categoryName = params.categoryName as string | undefined;

  const [searchQuery, setSearchQuery] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showFilterCityPicker, setShowFilterCityPicker] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    dateFilter: '',
    selectedDate: null as Date | null,
    typeEvent: false,
    typeVenues: false,
    typeCourses: false,
    categoryFilter: '',
    indoor: false,
    outdoor: false,
    free: false,
    minAge: '',
    maxAge: '',
    maxDistance: '',
  });
  const { t } = useLanguage();
  const { profile, updateProfile } = useAuth();

  useEffect(() => {
    if (categoryId) {
      setSelectedCategory(categoryId);
      setViewMode('list');
      loadCategoryActivities(categoryId);
    } else {
      loadActivities();
    }
    loadCities();
    loadCategories();
    if (profile?.location_name) {
      setSelectedCity(profile.location_name);
    }
  }, [categoryId]);

  useEffect(() => {
    if (profile?.location_name) {
      setSelectedCity(profile.location_name);
    }
  }, [profile?.location_name]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters, activities]);

  const loadActivities = async () => {
    try {
      const data = await activitiesService.getAll();
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const loadCategoryActivities = async (catId: string) => {
    try {
      const { data } = await supabase
        .from('activity_category_links')
        .select('activity_id, activities(*)')
        .eq('category_id', catId);

      if (data) {
        const categoryActivities = data
          .map((item: any) => item.activities)
          .filter(Boolean);
        setActivities(categoryActivities);
      }
    } catch (error) {
      console.error('Failed to load category activities:', error);
    }
  };

  const loadCities = async () => {
    try {
      const data = await citiesService.getAll();
      setCities(data);
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const selectCity = async (city: string) => {
    setSelectedCity(city);
    setShowCityPicker(false);

    try {
      const coords = await citiesService.getCityCoordinates(city);
      if (coords) {
        await updateProfile({
          location_lat: coords.lat,
          location_lng: coords.lng,
          location_name: city,
        });
      }
    } catch (error) {
      console.error('Failed to select city:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...activities];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(
        (activity) =>
          activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply all other filters using the service
    filtered = activitiesService.filterActivities(
      filtered,
      {
        indoor: filters.indoor,
        outdoor: filters.outdoor,
        free: filters.free,
        minAge: filters.minAge,
        maxAge: filters.maxAge,
        maxDistance: filters.maxDistance,
      },
      profile?.location_lat || undefined,
      profile?.location_lng || undefined
    );

    setFilteredActivities(filtered);
  };

  const clearFilters = () => {
    setFilters({
      dateFilter: '',
      selectedDate: null,
      typeEvent: false,
      typeVenues: false,
      typeCourses: false,
      categoryFilter: '',
      indoor: false,
      outdoor: false,
      free: false,
      minAge: '',
      maxAge: '',
      maxDistance: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some((value) =>
    typeof value === 'boolean' ? value : value !== ''
  );

  const renderActivity = ({ item }: { item: Activity }) => {
    let distance: number | undefined;
    if (profile?.location_lat && profile?.location_lng) {
      distance = calculateDistance(
        profile.location_lat,
        profile.location_lng,
        item.location_lat,
        item.location_lng
      );
    }

    return (
      <View style={styles.cardWrapper}>
        <ActivityCard
          id={item.id}
          name={item.name}
          city={item.city}
          distance={distance}
          image={item.images?.[0] || 'https://images.pexels.com/photos/1648387/pexels-photo-1648387.jpeg'}
          rating={item.average_rating}
          reviews={item.total_reviews}
          priceMin={item.price_min}
          priceMax={item.price_max}
          isFree={item.is_free}
          ageMin={item.age_min}
          ageMax={item.age_max}
          layout="horizontal"
        />
      </View>
    );
  };

  const openInGoogleMaps = () => {
    const userLat = profile?.location_lat || 52.3676;
    const userLng = profile?.location_lng || 4.9041;

    const url = Platform.select({
      ios: `maps://app?saddr=${userLat},${userLng}&daddr=${userLat},${userLng}&zoom=10`,
      android: `geo:${userLat},${userLng}?q=${userLat},${userLng}(Activities)&z=10`,
      default: `https://www.google.com/maps/@${userLat},${userLng},10z`,
    });

    Linking.openURL(url as string);
  };

  const renderMapView = () => {
    return (
      <View style={styles.mapPlaceholder}>
        <MapPinIcon size={64} color={Colors.primary} />
        <Text style={styles.mapPlaceholderTitle}>
          View Activities on Map
        </Text>
        <Text style={styles.mapPlaceholderText}>
          See all activities near you on Google Maps
        </Text>
        <TouchableOpacity
          style={styles.openMapsButton}
          onPress={openInGoogleMaps}
        >
          <MapPinIcon size={20} color={Colors.white} />
          <Text style={styles.openMapsButtonText}>
            Open in Google Maps
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backToListButton}
          onPress={() => setViewMode('list')}
        >
          <Text style={styles.backToListButtonText}>
            Back to List View
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{categoryName || t('nav.discover')}</Text>
          {categoryId && (
            <TouchableOpacity
              style={styles.clearCategoryButton}
              onPress={() => {
                router.push('/(tabs)/discover');
              }}
            >
              <X size={20} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.textLight} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('search.placeholder')}
              placeholderTextColor={Colors.lightGrey}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal
              size={20}
              color={hasActiveFilters ? Colors.primary : Colors.textLight}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowCityPicker(!showCityPicker)}
          >
            <MapPinIcon size={20} color={selectedCity ? Colors.primary : Colors.textLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              styles.toggleButtonLeft,
              viewMode === 'list' && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode('list')}
          >
            <List size={18} color={viewMode === 'list' ? Colors.white : Colors.primary} />
            <Text
              style={[
                styles.toggleButtonText,
                viewMode === 'list' && styles.toggleButtonTextActive,
              ]}
            >
              List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              styles.toggleButtonRight,
              viewMode === 'map' && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode('map')}
          >
            <MapPinIcon size={18} color={viewMode === 'map' ? Colors.white : Colors.primary} />
            <Text
              style={[
                styles.toggleButtonText,
                viewMode === 'map' && styles.toggleButtonTextActive,
              ]}
            >
              Map
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {(categoryName || hasActiveFilters) && (
        <View style={styles.activeFiltersBar}>
          <View style={styles.filterChipsRow}>
            {categoryName && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>{categoryName}</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/discover')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={Colors.textDark} />
                </TouchableOpacity>
              </View>
            )}
            {filters.dateFilter && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>
                  {filters.dateFilter === 'today' ? 'Today' :
                   filters.dateFilter === 'tomorrow' ? 'Tomorrow' :
                   filters.dateFilter === 'weekend' ? 'Weekend' : 'Pick Date'}
                </Text>
                <TouchableOpacity
                  onPress={() => setFilters({ ...filters, dateFilter: '' })}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={Colors.textDark} />
                </TouchableOpacity>
              </View>
            )}
            {filters.typeEvent && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>Event</Text>
                <TouchableOpacity
                  onPress={() => setFilters({ ...filters, typeEvent: false })}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={Colors.textDark} />
                </TouchableOpacity>
              </View>
            )}
            {filters.typeVenues && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>Venues</Text>
                <TouchableOpacity
                  onPress={() => setFilters({ ...filters, typeVenues: false })}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={Colors.textDark} />
                </TouchableOpacity>
              </View>
            )}
            {filters.typeCourses && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>Courses</Text>
                <TouchableOpacity
                  onPress={() => setFilters({ ...filters, typeCourses: false })}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={Colors.textDark} />
                </TouchableOpacity>
              </View>
            )}
            {filters.categoryFilter && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>
                  {categories.find(c => c.id === filters.categoryFilter)?.name || 'Category'}
                </Text>
                <TouchableOpacity
                  onPress={() => setFilters({ ...filters, categoryFilter: '' })}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={Colors.textDark} />
                </TouchableOpacity>
              </View>
            )}
            {filters.indoor && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>Indoor</Text>
                <TouchableOpacity
                  onPress={() => setFilters({ ...filters, indoor: false })}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={Colors.textDark} />
                </TouchableOpacity>
              </View>
            )}
            {filters.outdoor && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>Outdoor</Text>
                <TouchableOpacity
                  onPress={() => setFilters({ ...filters, outdoor: false })}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={Colors.textDark} />
                </TouchableOpacity>
              </View>
            )}
            {filters.free && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>Free</Text>
                <TouchableOpacity
                  onPress={() => setFilters({ ...filters, free: false })}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={Colors.textDark} />
                </TouchableOpacity>
              </View>
            )}
            {(filters.minAge || filters.maxAge) && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>
                  Ages {filters.minAge || '2'}-{filters.maxAge || 'Adult'}
                </Text>
                <TouchableOpacity
                  onPress={() => setFilters({ ...filters, minAge: '', maxAge: '' })}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={Colors.textDark} />
                </TouchableOpacity>
              </View>
            )}
            {filters.maxDistance && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>
                  Within {filters.maxDistance}km
                </Text>
                <TouchableOpacity
                  onPress={() => setFilters({ ...filters, maxDistance: '' })}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={Colors.textDark} />
                </TouchableOpacity>
              </View>
            )}
            {selectedCity && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>{selectedCity}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCity(null);
                    updateProfile({
                      location_lat: null,
                      location_lng: null,
                      location_name: null,
                    });
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={Colors.textDark} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {showCityPicker && (
        <View style={styles.cityPickerModal}>
          <View style={styles.cityPickerHeader}>
            <Text style={styles.cityPickerTitle}>Select Your City</Text>
            <TouchableOpacity onPress={() => setShowCityPicker(false)}>
              <X size={24} color={Colors.textDark} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={cities}
            keyExtractor={(city) => city}
            renderItem={({ item: city }) => (
              <TouchableOpacity
                style={[
                  styles.cityPickerOption,
                  selectedCity === city && styles.cityPickerOptionActive,
                ]}
                onPress={() => selectCity(city)}
              >
                <Text
                  style={[
                    styles.cityPickerOptionText,
                    selectedCity === city && styles.cityPickerOptionTextActive,
                  ]}
                >
                  {city}
                </Text>
                {selectedCity === city && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={28} color={Colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>DATES</Text>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setFilters({ ...filters, dateFilter: filters.dateFilter === 'today' ? '' : 'today' })}
              >
                <View style={[styles.radioCircle, filters.dateFilter === 'today' && styles.radioCircleActive]} />
                <Text style={styles.radioText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setFilters({ ...filters, dateFilter: filters.dateFilter === 'tomorrow' ? '' : 'tomorrow' })}
              >
                <View style={[styles.radioCircle, filters.dateFilter === 'tomorrow' && styles.radioCircleActive]} />
                <Text style={styles.radioText}>Tomorrow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setFilters({ ...filters, dateFilter: filters.dateFilter === 'weekend' ? '' : 'weekend' })}
              >
                <View style={[styles.radioCircle, filters.dateFilter === 'weekend' && styles.radioCircleActive]} />
                <Text style={styles.radioText}>Weekend</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setFilters({ ...filters, dateFilter: filters.dateFilter === 'pickDate' ? '' : 'pickDate' })}
              >
                <View style={[styles.radioCircle, filters.dateFilter === 'pickDate' && styles.radioCircleActive]} />
                <Text style={styles.radioText}>Pick A Date</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>TYPE</Text>
              <TouchableOpacity
                style={styles.checkboxOption}
                onPress={() => setFilters({ ...filters, typeEvent: !filters.typeEvent })}
              >
                <View style={[styles.checkbox, filters.typeEvent && styles.checkboxActive]} />
                <Text style={styles.checkboxText}>Event</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkboxOption}
                onPress={() => setFilters({ ...filters, typeVenues: !filters.typeVenues })}
              >
                <View style={[styles.checkbox, filters.typeVenues && styles.checkboxActive]} />
                <Text style={styles.checkboxText}>Venues</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkboxOption}
                onPress={() => setFilters({ ...filters, typeCourses: !filters.typeCourses })}
              >
                <View style={[styles.checkbox, filters.typeCourses && styles.checkboxActive]} />
                <Text style={styles.checkboxText}>Courses</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>CATEGORY</Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => {
                  setShowFilters(false);
                  setTimeout(() => setShowCategoryPicker(true), 300);
                }}
              >
                <Text style={filters.categoryFilter ? styles.selectBoxTextActive : styles.selectBoxText}>
                  {categories.find(c => c.id === filters.categoryFilter)?.name || 'Select'}
                </Text>
                <Text style={styles.selectBoxArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>VENUE TYPE</Text>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setFilters({ ...filters, indoor: !filters.indoor })}
              >
                <View style={[styles.radioCircle, filters.indoor && styles.radioCircleActive]} />
                <Text style={styles.radioText}>Indoor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setFilters({ ...filters, outdoor: !filters.outdoor })}
              >
                <View style={[styles.radioCircle, filters.outdoor && styles.radioCircleActive]} />
                <Text style={styles.radioText}>Outdoor</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>CITY</Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => {
                  setShowFilters(false);
                  setTimeout(() => setShowFilterCityPicker(true), 300);
                }}
              >
                <Text style={selectedCity ? styles.selectBoxTextActive : styles.selectBoxText}>
                  {selectedCity || 'Select'}
                </Text>
                <Text style={styles.selectBoxArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.filterSection}>
              <View style={styles.ageRangeHeader}>
                <Text style={styles.sectionTitle}>AGE RANGE</Text>
                <Text style={styles.ageRangeValue}>
                  ({filters.minAge || '2'} - {filters.maxAge || 'Adult'})
                </Text>
              </View>
              <View style={styles.ageInputRow}>
                <TextInput
                  style={styles.ageInput}
                  placeholder="Min"
                  placeholderTextColor={Colors.lightGrey}
                  value={filters.minAge}
                  onChangeText={(value) =>
                    setFilters({ ...filters, minAge: value.replace(/[^0-9]/g, '') })
                  }
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.ageSeparator}>-</Text>
                <TextInput
                  style={styles.ageInput}
                  placeholder="Max"
                  placeholderTextColor={Colors.lightGrey}
                  value={filters.maxAge}
                  onChangeText={(value) =>
                    setFilters({ ...filters, maxAge: value.replace(/[^0-9]/g, '') })
                  }
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                clearFilters();
                setShowFilters(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCategoryPicker}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity onPress={() => {
              setShowCategoryPicker(false);
              setTimeout(() => setShowFilters(true), 300);
            }}>
              <X size={28} color={Colors.textDark} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.cityItem}
                onPress={() => {
                  setFilters({ ...filters, categoryFilter: item.id });
                  setShowCategoryPicker(false);
                  setTimeout(() => setShowFilters(true), 300);
                }}
              >
                <Text style={styles.cityItemText}>
                  {item.name}
                </Text>
                {filters.categoryFilter === item.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <Modal
        visible={showFilterCityPicker}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowFilterCityPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select City</Text>
            <TouchableOpacity onPress={() => {
              setShowFilterCityPicker(false);
              setTimeout(() => setShowFilters(true), 300);
            }}>
              <X size={28} color={Colors.textDark} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={cities}
            keyExtractor={(item) => item}
            renderItem={({ item: city }) => (
              <TouchableOpacity
                style={styles.cityItem}
                onPress={async () => {
                  setSelectedCity(city);
                  setShowFilterCityPicker(false);
                  setTimeout(() => setShowFilters(true), 300);

                  try {
                    const coords = await citiesService.getCityCoordinates(city);
                    if (coords) {
                      await updateProfile({
                        location_lat: coords.lat,
                        location_lng: coords.lng,
                        location_name: city,
                      });
                    }
                  } catch (error) {
                    console.error('Failed to update city:', error);
                  }
                }}
              >
                <Text style={styles.cityItemText}>
                  {city}
                </Text>
                {selectedCity === city && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {viewMode === 'list' ? (
        <>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsText}>
              {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'} found
            </Text>
          </View>

          <FlatList
            data={filteredActivities}
            renderItem={renderActivity}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            numColumns={1}
          />
        </>
      ) : (
        renderMapView()
      )}
    </View>
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
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
  },
  clearCategoryButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFiltersBar: {
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F5FF',
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 10,
    borderRadius: 20,
    gap: 6,
  },
  activeFilterChipText: {
    fontSize: 14,
    color: Colors.textDark,
    fontWeight: '500',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textDark,
  },
  iconButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  toggleButtonLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  toggleButtonRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  toggleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  toggleButtonTextActive: {
    color: Colors.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  modalContent: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF9F66',
    marginRight: 12,
  },
  radioCircleActive: {
    borderWidth: 7,
    borderColor: '#FF9F66',
  },
  radioText: {
    fontSize: 16,
    color: Colors.textDark,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FF9F66',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: '#FF9F66',
  },
  checkboxText: {
    fontSize: 16,
    color: Colors.textDark,
  },
  selectBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectBoxText: {
    fontSize: 16,
    color: Colors.lightGrey,
  },
  selectBoxTextActive: {
    fontSize: 16,
    color: Colors.textDark,
  },
  selectBoxArrow: {
    fontSize: 12,
    color: '#4FC3F7',
  },
  ageRangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ageRangeValue: {
    fontSize: 14,
    color: Colors.textLight,
  },
  ageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ageInput: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textDark,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ageSeparator: {
    fontSize: 18,
    color: Colors.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4FC3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4FC3F7',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#4FC3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cardWrapper: {
    marginBottom: 16,
    width: '100%',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.background,
  },
  mapPlaceholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textDark,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
  },
  openMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  openMapsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  backToListButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backToListButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  cityPickerModal: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    maxHeight: 300,
  },
  cityPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cityPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  cityPickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cityPickerOptionActive: {
    backgroundColor: Colors.successLight,
  },
  cityPickerOptionText: {
    fontSize: 16,
    color: Colors.textDark,
  },
  cityPickerOptionTextActive: {
    fontWeight: '600',
    color: Colors.primary,
  },
  checkmark: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
