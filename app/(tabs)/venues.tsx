import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  FlatList,
  RefreshControl,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import FilterButton from '@/components/FilterButton';
import MapListToggle from '@/components/MapListToggle';
import VenuesFilterModal, { VenuesFilters } from '@/components/VenuesFilterModal';
import ActivityCard from '@/components/ActivityCard';
import { venuesService } from '@/services/venues';
import { Venue } from '@/types';

const { width, height } = Dimensions.get('window');

let MapView: any = null;
let Marker: any = null;

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
  } catch (e) {
    console.log('Maps not available on this platform');
  }
}

export default function VenuesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'map' | 'list'>('list');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<VenuesFilters>({
    environment: 'any',
    price: 'any',
    ageGroups: [],
    amenities: [],
    distance: 'any',
    openNow: false,
  });
  const { language } = useLanguage();
  const { profile } = useAuth();


  useEffect(() => {
    loadVenues();
  }, [filters]);

  const loadVenues = async () => {
    setLoading(true);
    try {
      let allVenues = searchQuery.trim()
        ? await venuesService.search(searchQuery)
        : await venuesService.getAll();

      if (filters.environment === 'indoor') {
        allVenues = allVenues.filter(v => v.is_indoor);
      } else if (filters.environment === 'outdoor') {
        allVenues = allVenues.filter(v => v.is_outdoor);
      } else if (filters.environment === 'both') {
        allVenues = allVenues.filter(v => v.is_indoor && v.is_outdoor);
      }

      if (filters.price === 'free') {
        allVenues = allVenues.filter(v => v.is_free);
      } else if (filters.price === 'under10') {
        allVenues = allVenues.filter(v => v.price_max <= 10);
      } else if (filters.price === 'under20') {
        allVenues = allVenues.filter(v => v.price_max <= 20);
      }

      if (filters.ageGroups.length > 0 && !filters.ageGroups.includes('all')) {
        allVenues = allVenues.filter(v => {
          return filters.ageGroups.some(ageGroup => {
            if (ageGroup === '0-3') return v.age_min <= 3;
            if (ageGroup === '4-7') return v.age_max >= 4 && v.age_min <= 7;
            if (ageGroup === '8-12') return v.age_max >= 8 && v.age_min <= 12;
            if (ageGroup === '13+') return v.age_max >= 13;
            return true;
          });
        });
      }

      if (filters.distance !== 'any' && profile?.location_lat && profile?.location_lng) {
        const maxDist = parseInt(filters.distance);
        allVenues = allVenues.filter(v => {
          const dist = calculateDistance(
            profile.location_lat!,
            profile.location_lng!,
            v.location_lat,
            v.location_lng
          );
          return dist <= maxDist;
        });
      }

      if (filters.openNow) {
        allVenues = allVenues.filter(v => isVenueOpen(v.venue_opening_hours));
      }

      const sortedData = sortByDistance(allVenues);
      setVenues(sortedData);
    } catch (error) {
      console.error('Error loading venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortByDistance = (venuesList: Venue[]) => {
    if (!profile?.location_lat || !profile?.location_lng) {
      return venuesList;
    }

    return venuesList.sort((a, b) => {
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

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.environment !== 'any') count++;
    if (filters.price !== 'any') count++;
    if (filters.ageGroups.length > 0) count++;
    if (filters.amenities.length > 0) count++;
    if (filters.distance !== 'any') count++;
    if (filters.openNow) count++;
    return count;
  };

  const getActiveFiltersSummary = () => {
    const summary: string[] = [];
    if (filters.environment === 'indoor') summary.push(language === 'en' ? 'Indoor' : 'Binnen');
    if (filters.environment === 'outdoor') summary.push(language === 'en' ? 'Outdoor' : 'Buiten');
    if (filters.environment === 'both') summary.push(language === 'en' ? 'Both' : 'Beide');
    if (filters.price === 'free') summary.push(language === 'en' ? 'Free' : 'Gratis');
    if (filters.price === 'under10') summary.push('< €10');
    if (filters.price === 'under20') summary.push('< €20');
    if (filters.ageGroups.length > 0) {
      summary.push(filters.ageGroups.join(', '));
    }
    if (filters.distance !== 'any') summary.push(`< ${filters.distance}km`);
    if (filters.openNow) summary.push(language === 'en' ? 'Open now' : 'Nu open');
    return summary;
  };

  const clearFilters = () => {
    setFilters({
      environment: 'any',
      price: 'any',
      ageGroups: [],
      amenities: [],
      distance: 'any',
      openNow: false,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVenues();
    setRefreshing(false);
  };

  const isVenueOpen = (openingHours: any) => {
    if (!openingHours) return false;

    const now = new Date();
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const todayHours = openingHours[dayOfWeek];
    if (!todayHours || todayHours.closed) return false;

    const [openHour, openMin] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close.split(':').map(Number);

    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    return currentTime >= openTime && currentTime <= closeTime;
  };

  const renderVenueCard = (venue: Venue) => {
    let distance: number | undefined;
    if (profile?.location_lat && profile?.location_lng) {
      distance = calculateDistance(
        profile.location_lat,
        profile.location_lng,
        venue.location_lat,
        venue.location_lng
      );
    }

    const isOpen = isVenueOpen(venue.venue_opening_hours);

    return (
      <View style={styles.venueCard}>
        <ActivityCard
          id={venue.id}
          name={venue.name}
          city={venue.city}
          distance={distance}
          image={venue.images?.[0] || 'https://images.pexels.com/photos/1648387/pexels-photo-1648387.jpeg'}
          rating={venue.average_rating}
          reviews={venue.total_reviews}
          priceMin={venue.price_min}
          priceMax={venue.price_max}
          isFree={venue.is_free}
          ageMin={venue.age_min}
          ageMax={venue.age_max}
          layout="horizontal"
          type="venue"
          collections={venue.collections}
          isIndoor={venue.is_indoor}
          isOutdoor={venue.is_outdoor}
          isOpen={isOpen}
        />
        <View style={styles.venueMetadata}>
          {venue.is_indoor && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {language === 'en' ? 'Indoor' : 'Binnen'}
              </Text>
            </View>
          )}
          {venue.is_outdoor && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {language === 'en' ? 'Outdoor' : 'Buiten'}
              </Text>
            </View>
          )}
          <View style={[styles.statusBadge, isOpen ? styles.statusOpen : styles.statusClosed]}>
            <Text style={styles.statusText}>
              {isOpen
                ? (language === 'en' ? 'Open' : 'Geopend')
                : (language === 'en' ? 'Closed' : 'Gesloten')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMapView = () => {
    if (Platform.OS === 'web' || !MapView) {
      return (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>
            {language === 'en'
              ? 'Map view is only available on mobile devices'
              : 'Kaartweergave is alleen beschikbaar op mobiele apparaten'}
          </Text>
        </View>
      );
    }

    const initialRegion = {
      latitude: profile?.location_lat || 52.3676,
      longitude: profile?.location_lng || 4.9041,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };

    return (
      <MapView style={styles.map} initialRegion={initialRegion}>
        {venues.map((venue) => (
          <Marker
            key={venue.id}
            coordinate={{
              latitude: venue.location_lat,
              longitude: venue.location_lng,
            }}
            title={venue.name}
            description={venue.city}
          />
        ))}
      </MapView>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={language === 'en' ? 'Play Spots near you' : 'Speelplekken'}
        showProfileIcon={false}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder={language === 'en' ? 'Search venues...' : 'Zoek locaties...'}
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={loadVenues}
          />
        </View>
        <FilterButton onPress={() => setShowFilterModal(true)} filterCount={getActiveFilterCount()} />
      </View>

      <View style={styles.toggleContainer}>
        <MapListToggle view={view} onToggle={setView} />
      </View>

      {getActiveFiltersSummary().length > 0 && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFiltersList}>
            <Text style={styles.activeFiltersLabel}>
              {language === 'en' ? 'Active:' : 'Actief:'}
            </Text>
            {getActiveFiltersSummary().map((filter, index) => (
              <View key={index} style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>{filter}</Text>
              </View>
            ))}
            <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
              <X size={16} color={Colors.textLight} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <VenuesFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onFiltersChange={setFilters}
        language={language}
      />

      {view === 'map' ? (
        renderMapView()
      ) : (
        <FlatList
          data={venues}
          renderItem={({ item }) => renderVenueCard(item)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {language === 'en'
                    ? 'No venues found for the selected filters'
                    : 'Geen locaties gevonden voor de geselecteerde filters'}
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textDark,
  },
  toggleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  activeFiltersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activeFiltersList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeFiltersLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
    marginRight: 4,
  },
  activeFilterChip: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeFilterText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textDark,
  },
  clearFiltersButton: {
    marginLeft: 4,
    padding: 4,
  },
  listContent: {
    padding: 20,
  },
  venueCard: {
    marginBottom: 16,
  },
  venueMetadata: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginLeft: 132,
  },
  badge: {
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusOpen: {
    backgroundColor: Colors.successLight,
  },
  statusClosed: {
    backgroundColor: Colors.mutedGrey,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textDark,
  },
  map: {
    flex: 1,
    width: width,
    height: height - 300,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 40,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
  },
});
