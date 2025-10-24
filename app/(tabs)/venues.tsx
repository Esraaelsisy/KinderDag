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
} from 'react-native';
import { Search } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import FilterChips from '@/components/FilterChips';
import MapListToggle from '@/components/MapListToggle';
import ActivityCard from '@/components/ActivityCard';
import { supabase } from '@/lib/supabase';
import { Activity } from '@/types';

const { width, height } = Dimensions.get('window');

export default function VenuesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [venues, setVenues] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'map' | 'list'>('list');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const { language } = useLanguage();
  const { profile } = useAuth();

  const filterChips = [
    { id: 'indoor', label: language === 'en' ? 'Indoor' : 'Binnen', value: 'indoor' },
    { id: 'outdoor', label: language === 'en' ? 'Outdoor' : 'Buiten', value: 'outdoor' },
    { id: 'free', label: language === 'en' ? 'Free' : 'Gratis', value: true },
    { id: 'parking', label: language === 'en' ? 'Parking' : 'Parkeren', value: 'parking' },
    { id: 'age0-3', label: '0-3y', value: '0-3' },
  ];

  useEffect(() => {
    loadVenues();
  }, [selectedFilters, profile?.location_name]);

  const loadVenues = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('activities')
        .select('*')
        .eq('type', 'venue')
        .order('average_rating', { ascending: false });

      if (profile?.location_name) {
        query = query.eq('city', profile.location_name);
      }

      if (selectedFilters.includes('free')) {
        query = query.eq('is_free', true);
      }

      if (selectedFilters.includes('indoor')) {
        query = query.eq('is_indoor', true);
      }

      if (selectedFilters.includes('outdoor')) {
        query = query.eq('is_outdoor', true);
      }

      if (selectedFilters.includes('age0-3')) {
        query = query.lte('age_min', 3);
      }

      if (searchQuery.trim()) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const sortedData = sortByDistance(data || []);
      setVenues(sortedData);
    } catch (error) {
      console.error('Error loading venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortByDistance = (venuesList: Activity[]) => {
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

  const handleFilterToggle = (chipId: string) => {
    setSelectedFilters(prev =>
      prev.includes(chipId) ? prev.filter(id => id !== chipId) : [...prev, chipId]
    );
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

  const renderVenueCard = (venue: Activity) => {
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
        title={language === 'en' ? 'Venues near you' : 'Locaties bij jou in de buurt'}
        showProfileIcon={true}
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
        <View style={styles.toggleContainer}>
          <MapListToggle view={view} onToggle={setView} />
        </View>
      </View>

      <View style={styles.filterChipsContainer}>
        <FilterChips
          chips={filterChips}
          selectedChips={selectedFilters}
          onChipPress={handleFilterToggle}
        />
      </View>

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
    paddingVertical: 16,
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
    width: 140,
  },
  filterChipsContainer: {
    marginVertical: 12,
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
