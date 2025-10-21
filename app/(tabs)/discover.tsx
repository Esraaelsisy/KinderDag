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
} from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import ActivityCard from '@/components/ActivityCard';
import { Search, SlidersHorizontal, X, List, MapPin as MapPinIcon } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

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
  is_indoor: boolean;
  is_outdoor: boolean;
}

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [filters, setFilters] = useState({
    indoor: false,
    outdoor: false,
    free: false,
    minAge: '',
    maxAge: '',
    maxDistance: '',
  });
  const { t } = useLanguage();
  const { profile } = useAuth();

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters, activities]);

  const loadActivities = async () => {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .order('average_rating', { ascending: false });

    if (data) {
      setActivities(data);
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

  const applyFilters = () => {
    let filtered = [...activities];

    if (searchQuery) {
      filtered = filtered.filter(
        (activity) =>
          activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.indoor) {
      filtered = filtered.filter((activity) => activity.is_indoor);
    }

    if (filters.outdoor) {
      filtered = filtered.filter((activity) => activity.is_outdoor);
    }

    if (filters.free) {
      filtered = filtered.filter((activity) => activity.is_free);
    }

    if (filters.minAge) {
      const minAge = parseInt(filters.minAge);
      filtered = filtered.filter((activity) => activity.age_max >= minAge);
    }

    if (filters.maxAge) {
      const maxAge = parseInt(filters.maxAge);
      filtered = filtered.filter((activity) => activity.age_min <= maxAge);
    }

    if (filters.maxDistance && profile?.location_lat && profile?.location_lng) {
      const maxDist = parseFloat(filters.maxDistance);
      filtered = filtered.filter((activity) => {
        const distance = calculateDistance(
          profile.location_lat!,
          profile.location_lng!,
          activity.location_lat,
          activity.location_lng
        );
        return distance <= maxDist;
      });
    }

    setFilteredActivities(filtered);
  };

  const clearFilters = () => {
    setFilters({
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
        <MapPinIcon size={64} color="#0f766e" />
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
          <MapPinIcon size={20} color="#ffffff" />
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
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.discover')}</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('search.placeholder')}
              placeholderTextColor="#94a3b8"
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
              color={hasActiveFilters ? '#10B981' : '#64748b'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {}}
          >
            <MapPinIcon size={20} color="#64748b" />
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
            <List size={18} color={viewMode === 'list' ? '#ffffff' : '#0f766e'} />
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
            <MapPinIcon size={18} color={viewMode === 'map' ? '#ffffff' : '#0f766e'} />
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
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>Filters</Text>
            {hasActiveFilters && (
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Activity Type</Text>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filters.indoor && styles.filterChipActive,
                ]}
                onPress={() => setFilters({ ...filters, indoor: !filters.indoor })}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filters.indoor && styles.filterChipTextActive,
                  ]}
                >
                  {t('activity.indoor')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filters.outdoor && styles.filterChipActive,
                ]}
                onPress={() => setFilters({ ...filters, outdoor: !filters.outdoor })}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filters.outdoor && styles.filterChipTextActive,
                  ]}
                >
                  {t('activity.outdoor')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filters.free && styles.filterChipActive,
                ]}
                onPress={() => setFilters({ ...filters, free: !filters.free })}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filters.free && styles.filterChipTextActive,
                  ]}
                >
                  {t('activity.free')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Age Range</Text>
            <View style={styles.filterRow}>
              <TextInput
                style={styles.filterInput}
                placeholder="Min age"
                placeholderTextColor="#94a3b8"
                value={filters.minAge}
                onChangeText={(value) =>
                  setFilters({ ...filters, minAge: value.replace(/[^0-9]/g, '') })
                }
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.filterSeparator}>to</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Max age"
                placeholderTextColor="#94a3b8"
                value={filters.maxAge}
                onChangeText={(value) =>
                  setFilters({ ...filters, maxAge: value.replace(/[^0-9]/g, '') })
                }
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>

          {profile?.location_lat && profile?.location_lng && (
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Max Distance (km)</Text>
              <TextInput
                style={styles.filterInputFull}
                placeholder="e.g., 25"
                placeholderTextColor="#94a3b8"
                value={filters.maxDistance}
                onChangeText={(value) =>
                  setFilters({ ...filters, maxDistance: value.replace(/[^0-9.]/g, '') })
                }
                keyboardType="decimal-pad"
              />
            </View>
          )}
        </View>
      )}

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
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
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
    backgroundColor: Colors.mutedGrey,
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
    color: Colors.text,
  },
  iconButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.mutedGrey,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#E3F5FC',
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
  filtersContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.mutedGrey,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  clearText: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '600',
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.lightGrey,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.mutedGrey,
  },
  filterChipActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.lightGrey,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  filterInput: {
    flex: 1,
    backgroundColor: Colors.mutedGrey,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  filterSeparator: {
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.lightGrey,
  },
  filterInputFull: {
    backgroundColor: Colors.mutedGrey,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 14,
    color: Colors.lightGrey,
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
    color: Colors.text,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: Colors.lightGrey,
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
});
