import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import ActivityCard from '@/components/ActivityCard';
import Header from '@/components/Header';
import FilterChips from '@/components/FilterChips';
import { Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Venue, Event } from '@/types';
import { favoritesService } from '@/services/favorites';
import { calculateDistance } from '@/utils/location';

type FilterType = 'all' | 'event' | 'venue';
type FavoriteItem = (Venue | Event) & { itemType: 'venue' | 'event' };

export default function FavoritesScreen() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  useEffect(() => {
    applyFilter();
  }, [selectedFilter, venues, events]);

  const loadFavorites = async () => {
    if (!user) return;

    try {
      const data = await favoritesService.getAll(user.id);
      setVenues(data.venues);
      setEvents(data.events);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  const applyFilter = () => {
    const allFavorites: FavoriteItem[] = [
      ...venues.map(v => ({ ...v, itemType: 'venue' as const })),
      ...events.map(e => ({ ...e, itemType: 'event' as const }))
    ];

    if (selectedFilter === 'all') {
      setFilteredFavorites(allFavorites);
    } else if (selectedFilter === 'venue') {
      setFilteredFavorites(venues.map(v => ({ ...v, itemType: 'venue' as const })));
    } else {
      setFilteredFavorites(events.map(e => ({ ...e, itemType: 'event' as const })));
    }
  };

  const filterChips = [
    { id: 'all', label: language === 'en' ? 'All' : 'Alles', value: 'all' },
    { id: 'event', label: language === 'en' ? 'Events' : 'Evenementen', value: 'event' },
    { id: 'venue', label: language === 'en' ? 'Venues' : 'Locaties', value: 'venue' },
  ];

  const handleFilterChange = (chipId: string) => {
    setSelectedFilter(chipId as FilterType);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const renderActivity = ({ item }: { item: FavoriteItem }) => {
    let distance: number | undefined;
    if (profile?.location_lat && profile?.location_lng) {
      distance = calculateDistance(
        profile.location_lat,
        profile.location_lng,
        item.location_lat,
        item.location_lng
      );
    }

    const isEvent = item.itemType === 'event';

    return (
      <View style={styles.cardWrapper}>
        <ActivityCard
          id={item.id}
          name={item.name}
          city={item.city}
          distance={distance}
          image={
            item.images?.[0] ||
            'https://images.pexels.com/photos/1648387/pexels-photo-1648387.jpeg'
          }
          rating={item.average_rating}
          reviews={item.total_reviews}
          priceMin={item.price_min}
          priceMax={item.price_max}
          isFree={item.is_free}
          ageMin={item.age_min}
          ageMax={item.age_max}
          layout="horizontal"
          type={item.itemType}
          eventStartDatetime={isEvent ? (item as Event).event_start_datetime : undefined}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={language === 'en' ? 'Saved' : 'Bewaard'}
        showProfileIcon={true}
      />

      {(venues.length > 0 || events.length > 0) && (
        <View style={styles.filterContainer}>
          <FilterChips
            chips={filterChips}
            selectedChips={[selectedFilter]}
            onChipPress={handleFilterChange}
          />
        </View>
      )}

      {venues.length === 0 && events.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Heart size={64} color={Colors.mutedGrey} />
          <Text style={styles.emptyTitle}>{t('favorites.empty')}</Text>
          <Text style={styles.emptyText}>{t('favorites.addSome')}</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredFavorites}
          renderItem={renderActivity}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          numColumns={1}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Heart size={64} color={Colors.mutedGrey} />
              <Text style={styles.emptyTitle}>
                {language === 'en' ? 'No favorites in this category' : 'Geen favorieten in deze categorie'}
              </Text>
            </View>
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
  },
  filterContainer: {
    paddingVertical: 16,
    backgroundColor: Colors.white,
  },
  list: {
    padding: 20,
  },
  cardWrapper: {
    marginBottom: 16,
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});
