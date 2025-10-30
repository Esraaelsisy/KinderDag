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
import { Search as SearchIcon, SlidersHorizontal, Bot, MapPin as MapPinIcon, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import ActivityCard from '@/components/ActivityCard';
import SegmentedControl from '@/components/SegmentedControl';
import FiltersBottomSheet, { SearchFilters } from '@/components/FiltersBottomSheet';
import FloatingMapButton from '@/components/FloatingMapButton';
import { supabase } from '@/lib/supabase';
import { Activity } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const FILTER_STORAGE_KEY = '@kinderdag_search_filters';
const SEGMENT_STORAGE_KEY = '@kinderdag_search_segment';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<Activity[]>([]);
  const [venues, setVenues] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<'events' | 'places'>('events');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    dateFilter: '',
    priceFilter: '',
    categoryIds: [],
  });
  const { language } = useLanguage();
  const { profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadSavedPreferences();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
      } else {
        setEvents([]);
        setVenues([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedSegment, filters]);

  const loadSavedPreferences = async () => {
    try {
      const [savedFilters, savedSegment] = await Promise.all([
        AsyncStorage.getItem(FILTER_STORAGE_KEY),
        AsyncStorage.getItem(SEGMENT_STORAGE_KEY),
      ]);

      if (savedFilters) {
        setFilters(JSON.parse(savedFilters));
      }
      if (savedSegment) {
        setSelectedSegment(savedSegment as 'events' | 'places');
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async (newFilters: SearchFilters, newSegment: 'events' | 'places') => {
    try {
      await Promise.all([
        AsyncStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(newFilters)),
        AsyncStorage.setItem(SEGMENT_STORAGE_KEY, newSegment),
      ]);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const searchPattern = `%${searchQuery}%`;
      const type = selectedSegment === 'events' ? 'event' : 'venue';

      let query = supabase
        .from('activities')
        .select('*')
        .eq('type', type);

      if (searchQuery.trim().length >= 2) {
        query = query.or(`name.ilike.${searchPattern},description_en.ilike.${searchPattern},description_nl.ilike.${searchPattern},city.ilike.${searchPattern}`);
      }

      if (filters.dateFilter) {
        const now = new Date();
        if (filters.dateFilter === 'today') {
          const today = now.toISOString().split('T')[0];
          query = query.gte('event_start_datetime', `${today}T00:00:00`)
                      .lte('event_start_datetime', `${today}T23:59:59`);
        } else if (filters.dateFilter === 'tomorrow') {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toISOString().split('T')[0];
          query = query.gte('event_start_datetime', `${tomorrowStr}T00:00:00`)
                      .lte('event_start_datetime', `${tomorrowStr}T23:59:59`);
        } else if (filters.dateFilter === 'weekend') {
          const dayOfWeek = now.getDay();
          const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
          const saturday = new Date(now);
          saturday.setDate(saturday.getDate() + daysUntilSaturday);
          const sunday = new Date(saturday);
          sunday.setDate(sunday.getDate() + 1);
          query = query.gte('event_start_datetime', saturday.toISOString())
                      .lte('event_start_datetime', sunday.toISOString());
        }
      }

      if (filters.priceFilter === 'free') {
        query = query.eq('is_free', true);
      } else if (filters.priceFilter === 'under10') {
        query = query.lte('price_max', 10);
      }

      if (filters.ageMin !== undefined) {
        query = query.lte('age_min', filters.ageMin);
      }
      if (filters.ageMax !== undefined) {
        query = query.gte('age_max', filters.ageMax);
      }

      if (filters.isIndoor !== undefined) {
        query = query.eq('is_indoor', filters.isIndoor);
      }
      if (filters.isOutdoor !== undefined) {
        query = query.eq('is_outdoor', filters.isOutdoor);
      }

      query = query.order('average_rating', { ascending: false }).limit(20);

      const result = await query;

      if (selectedSegment === 'events') {
        setEvents(result.data || []);
      } else {
        setVenues(result.data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSegmentChange = (segment: 'events' | 'places') => {
    setSelectedSegment(segment);
    savePreferences(filters, segment);
  };

  const handleApplyFilters = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    savePreferences(newFilters, selectedSegment);
  };

  const handleClearFilters = () => {
    const clearedFilters: SearchFilters = {
      dateFilter: '',
      priceFilter: '',
      categoryIds: [],
    };
    setFilters(clearedFilters);
    savePreferences(clearedFilters, selectedSegment);
  };

  const hasActiveFilters = () => {
    return filters.dateFilter !== '' ||
           filters.priceFilter !== '' ||
           filters.ageMin !== undefined ||
           filters.ageMax !== undefined ||
           filters.isIndoor ||
           filters.isOutdoor ||
           filters.categoryIds.length > 0;
  };

  const getSmartChips = () => {
    const chips = [
      { value: 'today', labelEn: 'Today', labelNl: 'Vandaag' },
      { value: 'weekend', labelEn: 'Weekend', labelNl: 'Weekend' },
      { value: 'free', labelEn: 'Free', labelNl: 'Gratis' },
    ];
    return chips;
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
          layout="vertical"
          type={activity.type as 'event' | 'venue'}
          eventStartDatetime={activity.event_start_datetime}
        />
      </View>
    );
  };

  const currentResults = selectedSegment === 'events' ? events : venues;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>
              {language === 'en' ? 'Explore' : 'Ontdek'}
              {profile?.city && (
                <Text style={styles.cityText}> {profile.city}</Text>
              )}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <MapPinIcon size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <SearchIcon size={20} color={Colors.textLight} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={language === 'en' ? 'Search or ask KinderAI…' : 'Zoeken of vraag KinderAI…'}
              placeholderTextColor={Colors.lightGrey}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowFilters(true)}
          >
            <SlidersHorizontal
              size={20}
              color={hasActiveFilters() ? Colors.teal : Colors.textLight}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <Bot size={20} color={Colors.textLight} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.chipSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {getSmartChips().map((chip) => {
            const isActive = chip.value === filters.dateFilter || chip.value === filters.priceFilter;
            return (
              <TouchableOpacity
                key={chip.value}
                style={[styles.smartChip, isActive && styles.smartChipActive]}
                onPress={() => {
                  if (chip.value === 'free') {
                    setFilters({
                      ...filters,
                      priceFilter: isActive ? '' : chip.value,
                    });
                  } else {
                    setFilters({
                      ...filters,
                      dateFilter: isActive ? '' : chip.value,
                    });
                  }
                }}
              >
                <Text style={[styles.smartChipText, isActive && styles.smartChipTextActive]}>
                  {language === 'en' ? chip.labelEn : chip.labelNl}
                </Text>
              </TouchableOpacity>
            );
          })}
          {hasActiveFilters() && (
            <TouchableOpacity
              style={styles.clearChip}
              onPress={handleClearFilters}
            >
              <X size={14} color={Colors.error} />
              <Text style={styles.clearChipText}>
                {language === 'en' ? 'Clear' : 'Wissen'}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <View style={styles.segmentContainer}>
        <SegmentedControl
          selectedSegment={selectedSegment}
          onSegmentChange={handleSegmentChange}
          language={language}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {searchQuery.trim().length < 2 && currentResults.length === 0 ? (
          <View style={styles.emptyState}>
            <SearchIcon size={48} color={Colors.textLight} />
            <Text style={styles.emptyStateTitle}>
              {language === 'en' ? 'Start exploring' : 'Begin met ontdekken'}
            </Text>
            <Text style={styles.emptyStateText}>
              {language === 'en'
                ? 'Search for events and places, or ask KinderAI for personalized suggestions'
                : 'Zoek naar evenementen en locaties, of vraag KinderAI om persoonlijke suggesties'}
            </Text>
            <TouchableOpacity
              style={styles.aiButton}
              onPress={() => router.push('/(tabs)/chat')}
            >
              <Bot size={20} color={Colors.white} />
              <Text style={styles.aiButtonText}>
                {language === 'en' ? 'Ask KinderAI' : 'Vraag KinderAI'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : currentResults.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <SearchIcon size={48} color={Colors.textLight} />
            <Text style={styles.emptyStateTitle}>
              {language === 'en' ? 'No results found' : 'Geen resultaten gevonden'}
            </Text>
            <Text style={styles.emptyStateText}>
              {language === 'en'
                ? 'Try adjusting your filters or search terms'
                : 'Probeer je filters of zoektermen aan te passen'}
            </Text>
            {hasActiveFilters() && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleClearFilters}
              >
                <Text style={styles.secondaryButtonText}>
                  {language === 'en' ? 'Clear filters' : 'Filters wissen'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={currentResults}
            renderItem={({ item }) => renderActivity(item)}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {currentResults.length > 0 && (
        <FloatingMapButton
          onPress={() => {
            }}
          language={language}
        />
      )}

      <FiltersBottomSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={handleApplyFilters}
        language={language}
      />
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
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
  },
  cityText: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.white,
    opacity: 0.9,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textDark,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSection: {
    backgroundColor: Colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chipsRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  smartChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  smartChipActive: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  smartChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textDark,
  },
  smartChipTextActive: {
    color: Colors.white,
  },
  clearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  clearChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.error,
  },
  segmentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardWrapper: {
    width: '48%',
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
    marginBottom: 24,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.teal,
  },
  aiButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.inputBackground,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
  },
});
