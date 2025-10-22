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
import { Search, SlidersHorizontal, X, List, MapPin as MapPinIcon, SearchX, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react-native';
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
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name_en: string; name_nl: string }>>([]);
  const [tags, setTags] = useState<Array<{ id: string; name: string; slug: string; color: string }>>([]);
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
    minAge: '0',
    maxAge: '12',
    maxDistance: '',
    selectedTags: [] as string[],
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { t, language } = useLanguage();
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
    loadTags();
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
        .from('activity_categories')
        .select('id, name_en, name_nl')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('id, name, slug, color')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Failed to load tags:', error);
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

  const applyFilters = async () => {
    let filtered = [...activities];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(
        (activity) =>
          activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply tag filters (OR logic)
    if (filters.selectedTags.length > 0) {
      const { data: taggedActivityIds } = await supabase
        .from('activity_tag_links')
        .select('activity_id')
        .in('tag_id', filters.selectedTags);

      if (taggedActivityIds) {
        const activityIds = new Set(taggedActivityIds.map(item => item.activity_id));
        filtered = filtered.filter(activity => activityIds.has(activity.id));
      }
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
      minAge: '0',
      maxAge: '12',
      maxDistance: '',
      selectedTags: [],
    });
  };

  const hasActiveFilters = Object.values(filters).some((value) =>
    typeof value === 'boolean' ? value : Array.isArray(value) ? value.length > 0 : value !== ''
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const changeMonth = (offset: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setCurrentMonth(newMonth);
  };

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
          <Text style={styles.title}>{t('nav.discover')}</Text>
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
                  {language === 'en'
                    ? categories.find(c => c.id === filters.categoryFilter)?.name_en
                    : categories.find(c => c.id === filters.categoryFilter)?.name_nl || 'Category'}
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
            {(filters.minAge !== '0' || filters.maxAge !== '12') && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>
                  Ages {filters.minAge || '0'}-{filters.maxAge || '12'}
                </Text>
                <TouchableOpacity
                  onPress={() => setFilters({ ...filters, minAge: '0', maxAge: '12' })}
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
            {filters.selectedTags.map((tagId) => {
              const tag = tags.find(t => t.id === tagId);
              if (!tag) return null;
              return (
                <View key={tagId} style={styles.activeFilterChip}>
                  <View style={[styles.tagColorDot, { backgroundColor: tag.color }]} />
                  <Text style={styles.activeFilterChipText}>{tag.name}</Text>
                  <TouchableOpacity
                    onPress={() => setFilters({
                      ...filters,
                      selectedTags: filters.selectedTags.filter(id => id !== tagId)
                    })}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={16} color={Colors.textDark} />
                  </TouchableOpacity>
                </View>
              );
            })}
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
                onPress={() => {
                  setShowDatePicker(true);
                  setTempSelectedDate(filters.selectedDate || new Date());
                  setCurrentMonth(filters.selectedDate || new Date());
                }}
              >
                <View style={[styles.radioCircle, filters.dateFilter === 'pickDate' && styles.radioCircleActive]} />
                <Text style={styles.radioText}>
                  {filters.dateFilter === 'pickDate' && filters.selectedDate
                    ? `Pick A Date (${filters.selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
                    : 'Pick A Date'}
                </Text>
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
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={filters.categoryFilter ? styles.selectBoxTextActive : styles.selectBoxText}>
                  {filters.categoryFilter
                    ? (language === 'en'
                      ? categories.find(c => c.id === filters.categoryFilter)?.name_en
                      : categories.find(c => c.id === filters.categoryFilter)?.name_nl) || 'Select'
                    : 'Select'}
                </Text>
                <Text style={styles.selectBoxArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>TAGS</Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setShowTagsModal(true)}
              >
                <Text style={filters.selectedTags.length > 0 ? styles.selectBoxTextActive : styles.selectBoxText}>
                  {filters.selectedTags.length > 0
                    ? `${filters.selectedTags.length} tag${filters.selectedTags.length > 1 ? 's' : ''} selected`
                    : 'Select tags'}
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
                onPress={() => setShowCityModal(true)}
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
                  ({filters.minAge || '0'} - {filters.maxAge || '12'})
                </Text>
              </View>
              <View style={styles.rangePickerContainer}>
                <View style={styles.rangeTrack}>
                  <View
                    style={[
                      styles.rangeProgress,
                      {
                        left: `${(parseInt(filters.minAge) || 0) / 12 * 100}%`,
                        right: `${100 - (parseInt(filters.maxAge) || 12) / 12 * 100}%`,
                      },
                    ]}
                  />
                  <TouchableOpacity
                    style={[
                      styles.rangeThumb,
                      {
                        left: `${(parseInt(filters.minAge) || 0) / 12 * 100}%`,
                      },
                    ]}
                    onPress={() => {
                      const currentMin = parseInt(filters.minAge) || 0;
                      const newMin = currentMin > 0 ? currentMin - 1 : 0;
                      setFilters({ ...filters, minAge: newMin.toString() });
                    }}
                    onLongPress={() => {
                      const currentMin = parseInt(filters.minAge) || 0;
                      const maxAge = parseInt(filters.maxAge) || 12;
                      const newMin = currentMin < maxAge ? currentMin + 1 : currentMin;
                      setFilters({ ...filters, minAge: newMin.toString() });
                    }}
                  />
                  <TouchableOpacity
                    style={[
                      styles.rangeThumb,
                      {
                        left: `${(parseInt(filters.maxAge) || 12) / 12 * 100}%`,
                      },
                    ]}
                    onPress={() => {
                      const currentMax = parseInt(filters.maxAge) || 12;
                      const minAge = parseInt(filters.minAge) || 0;
                      const newMax = currentMax > minAge ? currentMax - 1 : currentMax;
                      setFilters({ ...filters, maxAge: newMax.toString() });
                    }}
                    onLongPress={() => {
                      const currentMax = parseInt(filters.maxAge) || 12;
                      const newMax = currentMax < 12 ? currentMax + 1 : 12;
                      setFilters({ ...filters, maxAge: newMax.toString() });
                    }}
                  />
                </View>
                <View style={styles.rangeLabels}>
                  <Text style={styles.rangeLabelText}>0</Text>
                  <Text style={styles.rangeLabelText}>12</Text>
                </View>
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
        visible={showCategoryModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <X size={28} color={Colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.selectionList} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.selectionItem}
              onPress={() => {
                setFilters({ ...filters, categoryFilter: '' });
                setShowCategoryModal(false);
              }}
            >
              <Text style={[styles.selectionItemText, !filters.categoryFilter && styles.selectionItemTextActive]}>
                Select
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.selectionItem}
                onPress={() => {
                  setFilters({ ...filters, categoryFilter: category.id });
                  setShowCategoryModal(false);
                }}
              >
                <Text style={[styles.selectionItemText, filters.categoryFilter === category.id && styles.selectionItemTextActive]}>
                  {language === 'en' ? category.name_en : category.name_nl}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showCityModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCityModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select</Text>
            <TouchableOpacity onPress={() => setShowCityModal(false)}>
              <X size={28} color={Colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.selectionList} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.selectionItem}
              onPress={() => {
                setSelectedCity(null);
                updateProfile({
                  location_lat: null,
                  location_lng: null,
                  location_name: null,
                });
                setShowCityModal(false);
              }}
            >
              <Text style={[styles.selectionItemText, !selectedCity && styles.selectionItemTextActive]}>
                Select
              </Text>
            </TouchableOpacity>
            {cities.map((city) => (
              <TouchableOpacity
                key={city}
                style={styles.selectionItem}
                onPress={async () => {
                  setSelectedCity(city);
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
                  setShowCityModal(false);
                }}
              >
                <Text style={[styles.selectionItemText, selectedCity === city && styles.selectionItemTextActive]}>
                  {city}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showTagsModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowTagsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Tags</Text>
            <TouchableOpacity onPress={() => setShowTagsModal(false)}>
              <X size={28} color={Colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.selectionList} showsVerticalScrollIndicator={false}>
            {tags.map((tag) => {
              const isSelected = filters.selectedTags.includes(tag.id);
              return (
                <TouchableOpacity
                  key={tag.id}
                  style={styles.selectionItem}
                  onPress={() => {
                    const newSelectedTags = isSelected
                      ? filters.selectedTags.filter(id => id !== tag.id)
                      : [...filters.selectedTags, tag.id];
                    setFilters({ ...filters, selectedTags: newSelectedTags });
                  }}
                >
                  <View style={styles.tagRow}>
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]} />
                    <View style={[styles.tagColorDot, { backgroundColor: tag.color }]} />
                    <Text style={[styles.selectionItemText, isSelected && styles.selectionItemTextActive]}>
                      {tag.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setFilters({ ...filters, selectedTags: [] });
                setShowTagsModal(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowTagsModal(false)}
            >
              <Text style={styles.applyButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDatePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Select date</Text>
            </View>

            <View style={styles.datePickerSelectedContainer}>
              <Text style={styles.datePickerSelectedDate}>
                {tempSelectedDate
                  ? tempSelectedDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'No date selected'}
              </Text>
              <Edit3 size={20} color={Colors.textDark} />
            </View>

            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  onPress={() => changeMonth(-1)}
                  style={styles.monthNavButton}
                >
                  <ChevronLeft size={24} color={Colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.monthYearText}>{formatMonthYear(currentMonth)}</Text>
                <TouchableOpacity
                  onPress={() => changeMonth(1)}
                  style={styles.monthNavButton}
                >
                  <ChevronRight size={24} color={Colors.textDark} />
                </TouchableOpacity>
              </View>

              <View style={styles.weekDaysContainer}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <Text key={index} style={styles.weekDayText}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.daysContainer}>
                {(() => {
                  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
                  const days = [];

                  for (let i = 0; i < startingDayOfWeek; i++) {
                    days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
                  }

                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    const isSelected = isSameDay(date, tempSelectedDate);
                    days.push(
                      <TouchableOpacity
                        key={day}
                        style={styles.dayCell}
                        onPress={() => setTempSelectedDate(date)}
                      >
                        <View style={[styles.dayButton, isSelected && styles.dayButtonSelected]}>
                          <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                            {day}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }

                  return days;
                })()}
              </View>
            </View>

            <View style={styles.datePickerFooter}>
              <TouchableOpacity
                onPress={() => {
                  setTempSelectedDate(null);
                  setShowDatePicker(false);
                }}
                style={styles.datePickerCancelButton}
              >
                <Text style={styles.datePickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (tempSelectedDate) {
                    setFilters({
                      ...filters,
                      dateFilter: 'pickDate',
                      selectedDate: tempSelectedDate,
                    });
                  }
                  setShowDatePicker(false);
                }}
                style={styles.datePickerOkButton}
              >
                <Text style={styles.datePickerOkText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {viewMode === 'list' ? (
        <>
          {filteredActivities.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIconContainer}>
                <SearchX size={64} color={Colors.secondary} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyStateTitle}>No Search Results Found</Text>
              <Text style={styles.emptyStateSubtitle}>Wanna try again?</Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => {
                  setSearchQuery('');
                  clearFilters();
                  if (categoryId) {
                    router.push('/(tabs)/discover');
                  }
                }}
              >
                <Text style={styles.emptyStateButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredActivities}
              renderItem={renderActivity}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              numColumns={1}
            />
          )}
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
  scrollableList: {
    maxHeight: 200,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  listItemText: {
    fontSize: 16,
    color: '#64748b',
  },
  listItemTextActive: {
    color: Colors.textDark,
    fontWeight: '500',
  },
  ageRangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ageRangeValue: {
    fontSize: 16,
    color: Colors.secondary,
    fontWeight: '600',
  },
  ageRangeDefault: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
    textAlign: 'right',
  },
  rangePickerContainer: {
    marginTop: 10,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  rangeLabelText: {
    fontSize: 14,
    color: Colors.textDark,
    fontWeight: '500',
  },
  rangeTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    position: 'relative',
    marginBottom: 10,
  },
  rangeProgress: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#14b8a6',
    borderRadius: 2,
    top: 0,
  },
  rangeThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f97316',
    top: -10,
    marginLeft: -12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  ageInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  ageInputGroup: {
    flex: 1,
  },
  ageInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  ageInput: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textDark,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
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
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    paddingTop: 80,
  },
  emptyStateIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 18,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyStateButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
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
  selectionList: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  selectionItem: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  selectionItemText: {
    fontSize: 16,
    color: '#64748b',
  },
  selectionItemTextActive: {
    color: Colors.textDark,
    fontWeight: '500',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tagColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerModal: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  datePickerHeader: {
    padding: 20,
    paddingBottom: 16,
  },
  datePickerTitle: {
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '500',
  },
  datePickerSelectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  datePickerSelectedDate: {
    fontSize: 32,
    fontWeight: '400',
    color: Colors.textDark,
  },
  calendarContainer: {
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthNavButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textDark,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  dayButtonSelected: {
    backgroundColor: '#0891b2',
  },
  dayText: {
    fontSize: 16,
    color: Colors.textDark,
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  datePickerFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    paddingTop: 12,
    gap: 16,
  },
  datePickerCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  datePickerCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0891b2',
  },
  datePickerOkButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  datePickerOkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0891b2',
  },
});
