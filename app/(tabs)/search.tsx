import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Search as SearchIcon, Calendar, MapPinned } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import ActivityCard from '@/components/ActivityCard';
import { supabase } from '@/lib/supabase';
import { Activity } from '@/types';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<Activity[]>([]);
  const [venues, setVenues] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();
  const { profile } = useAuth();

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      performSearch();
    } else {
      setEvents([]);
      setVenues([]);
    }
  }, [searchQuery]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const searchPattern = `%${searchQuery}%`;

      const eventsQuery = supabase
        .from('activities')
        .select('*')
        .eq('type', 'event')
        .or(`name.ilike.${searchPattern},description_en.ilike.${searchPattern},description_nl.ilike.${searchPattern},city.ilike.${searchPattern}`)
        .order('average_rating', { ascending: false })
        .limit(10);

      const venuesQuery = supabase
        .from('activities')
        .select('*')
        .eq('type', 'venue')
        .or(`name.ilike.${searchPattern},description_en.ilike.${searchPattern},description_nl.ilike.${searchPattern},city.ilike.${searchPattern}`)
        .order('average_rating', { ascending: false })
        .limit(10);

      const [eventsResult, venuesResult] = await Promise.all([
        eventsQuery,
        venuesQuery,
      ]);

      if (eventsResult.data) setEvents(eventsResult.data);
      if (venuesResult.data) setVenues(venuesResult.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
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
      <View style={styles.cardWrapper}>
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
          layout="horizontal"
          type={activity.type as 'event' | 'venue'}
          eventStartDatetime={activity.event_start_datetime}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={language === 'en' ? 'Explore' : 'Ontdek'}
        showProfileIcon={true}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SearchIcon size={20} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder={language === 'en' ? 'Search events, venues...' : 'Zoek evenementen, locaties...'}
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {searchQuery.trim().length < 2 ? (
          <View style={styles.emptyState}>
            <SearchIcon size={48} color={Colors.textLight} />
            <Text style={styles.emptyStateTitle}>
              {language === 'en' ? 'Start searching' : 'Begin met zoeken'}
            </Text>
            <Text style={styles.emptyStateText}>
              {language === 'en'
                ? 'Search for events and venues by name, location, or description'
                : 'Zoek naar evenementen en locaties op naam, locatie of beschrijving'}
            </Text>
          </View>
        ) : (
          <>
            {events.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Calendar size={20} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>
                    {language === 'en' ? 'Events' : 'Evenementen'}
                  </Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{events.length}</Text>
                  </View>
                </View>
                {events.map((event) => (
                  <View key={event.id}>{renderActivity(event)}</View>
                ))}
              </View>
            )}

            {venues.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MapPinned size={20} color={Colors.secondary} />
                  <Text style={styles.sectionTitle}>
                    {language === 'en' ? 'Venues' : 'Locaties'}
                  </Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{venues.length}</Text>
                  </View>
                </View>
                {venues.map((venue) => (
                  <View key={venue.id}>{renderActivity(venue)}</View>
                ))}
              </View>
            )}

            {events.length === 0 && venues.length === 0 && searchQuery.trim().length >= 2 && !loading && (
              <View style={styles.emptyState}>
                <SearchIcon size={48} color={Colors.textLight} />
                <Text style={styles.emptyStateTitle}>
                  {language === 'en' ? 'No results found' : 'Geen resultaten gevonden'}
                </Text>
                <Text style={styles.emptyStateText}>
                  {language === 'en'
                    ? 'Try adjusting your search terms'
                    : 'Probeer je zoektermen aan te passen'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
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
  },
  searchBar: {
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
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
  },
  badge: {
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondary,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
});
