import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import FilterChips from '@/components/FilterChips';
import FilterButton from '@/components/FilterButton';
import EventsFilterModal, { EventsFilters } from '@/components/EventsFilterModal';
import ActivityCard from '@/components/ActivityCard';
import { eventsService } from '@/services/events';
import { Event } from '@/types';

type DateFilter = 'today' | 'tomorrow' | 'weekend' | 'month';

export default function EventsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<EventsFilters>({
    price: 'any',
    ageGroups: [],
    distance: 'any',
    timeOfDay: [],
  });
  const { language } = useLanguage();
  const { profile } = useAuth();

  const locationName = useMemo(() => profile?.location_name, [profile?.location_name]);
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters.price, filters.distance, filters.ageGroups.join(','), filters.timeOfDay.join(',')]);

  const dateChips = [
    { id: 'today', label: language === 'en' ? 'Today' : 'Vandaag', value: 'today' },
    { id: 'tomorrow', label: language === 'en' ? 'Tomorrow' : 'Morgen', value: 'tomorrow' },
    { id: 'weekend', label: language === 'en' ? 'Weekend' : 'Weekend', value: 'weekend' },
    { id: 'month', label: language === 'en' ? 'This Month' : 'Deze Maand', value: 'month' },
  ];


  useEffect(() => {
    loadEvents();
  }, [selectedDateFilter, filtersKey, locationName]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      let allEvents: Event[];

      if (searchQuery.trim()) {
        allEvents = await eventsService.search(searchQuery);
      } else if (selectedDateFilter) {
        const dateRange = getDateRange(selectedDateFilter);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        allEvents = await eventsService.getByDateRange(startDate, endDate);
      } else {
        allEvents = await eventsService.getUpcoming();
      }

      console.log('Raw events from service:', allEvents.length, allEvents);

      if (profile?.location_name) {
        console.log('Filtering by city:', profile.location_name);
        allEvents = allEvents.filter(e => e.city === profile.location_name);
      }

      if (filters.price === 'free') {
        allEvents = allEvents.filter(e => e.is_free);
      } else if (filters.price === 'under10') {
        allEvents = allEvents.filter(e => e.price_max <= 10);
      } else if (filters.price === 'under20') {
        allEvents = allEvents.filter(e => e.price_max <= 20);
      }

      if (filters.ageGroups.length > 0 && !filters.ageGroups.includes('all')) {
        allEvents = allEvents.filter(e => {
          return filters.ageGroups.some(ageGroup => {
            if (ageGroup === '0-3') return e.age_min <= 3;
            if (ageGroup === '4-7') return e.age_max >= 4 && e.age_min <= 7;
            if (ageGroup === '8-12') return e.age_max >= 8 && e.age_min <= 12;
            if (ageGroup === '13+') return e.age_max >= 13;
            return true;
          });
        });
      }

      if (filters.distance !== 'any' && profile?.location_lat && profile?.location_lng) {
        const maxDist = parseInt(filters.distance);
        allEvents = allEvents.filter(e => {
          const dist = calculateDistance(
            profile.location_lat!,
            profile.location_lng!,
            e.location_lat,
            e.location_lng
          );
          return dist <= maxDist;
        });
      }

      if (filters.timeOfDay.length > 0) {
        allEvents = allEvents.filter(e => {
          const date = new Date(e.event_start_datetime || '');
          const hour = date.getHours();
          return filters.timeOfDay.some(time => {
            if (time === 'morning') return hour < 12;
            if (time === 'afternoon') return hour >= 12 && hour < 17;
            if (time === 'evening') return hour >= 17;
            return true;
          });
        });
      }

      allEvents.sort((a, b) =>
        new Date(a.event_start_datetime).getTime() - new Date(b.event_start_datetime).getTime()
      );

      console.log('Final filtered events:', allEvents.length, allEvents);
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (filter: DateFilter | null) => {
    if (!filter) {
      const now = new Date();
      const end = new Date(now);
      end.setFullYear(end.getFullYear() + 1);
      return {
        start: now.toISOString(),
        end: end.toISOString(),
      };
    }

    const now = new Date();
    const start = new Date(now);
    let end = new Date(now);

    start.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'today':
        end.setHours(23, 59, 59, 999);
        break;
      case 'tomorrow':
        start.setDate(start.getDate() + 1);
        end.setDate(end.getDate() + 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekend':
        const dayOfWeek = now.getDay();
        if (dayOfWeek === 6) {
          end.setDate(end.getDate() + 1);
          end.setHours(23, 59, 59, 999);
        } else if (dayOfWeek === 0) {
          end.setHours(23, 59, 59, 999);
        } else {
          const daysUntilSaturday = 6 - dayOfWeek;
          start.setDate(start.getDate() + daysUntilSaturday);
          end.setDate(start.getDate() + 1);
          end.setHours(23, 59, 59, 999);
        }
        break;
      case 'month':
        end.setMonth(end.getMonth() + 1);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.price !== 'any') count++;
    if (filters.ageGroups.length > 0) count++;
    if (filters.distance !== 'any') count++;
    if (filters.timeOfDay.length > 0) count++;
    return count;
  };

  const getActiveFiltersSummary = () => {
    const summary: string[] = [];
    if (filters.price === 'free') summary.push(language === 'en' ? 'Free' : 'Gratis');
    if (filters.price === 'under10') summary.push('< €10');
    if (filters.price === 'under20') summary.push('< €20');
    if (filters.ageGroups.length > 0) {
      summary.push(filters.ageGroups.join(', '));
    }
    if (filters.distance !== 'any') summary.push(`< ${filters.distance}km`);
    if (filters.timeOfDay.length > 0) {
      const times = filters.timeOfDay.map(t => {
        if (t === 'morning') return language === 'en' ? 'Morning' : 'Ochtend';
        if (t === 'afternoon') return language === 'en' ? 'Afternoon' : 'Middag';
        if (t === 'evening') return language === 'en' ? 'Evening' : 'Avond';
        return t;
      });
      summary.push(times.join(', '));
    }
    return summary;
  };

  const clearFilters = () => {
    setFilters({
      price: 'any',
      ageGroups: [],
      distance: 'any',
      timeOfDay: [],
    });
  };

  const handleDateFilterToggle = (chipId: string) => {
    if (selectedDateFilter === chipId) {
      setSelectedDateFilter(null);
    } else {
      setSelectedDateFilter(chipId as DateFilter);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const formatEventDate = (datetime: string) => {
    const date = new Date(datetime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return language === 'en' ? 'Today' : 'Vandaag';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return language === 'en' ? 'Tomorrow' : 'Morgen';
    } else {
      return date.toLocaleDateString(language === 'en' ? 'en-US' : 'nl-NL', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatEventTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleTimeString(language === 'en' ? 'en-US' : 'nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const groupedEvents = events.reduce((acc, event) => {
    const dateKey = formatEventDate(event.event_start_datetime || '');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

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

  return (
    <View style={styles.container}>
      <Header
        title={language === 'en' ? "What's On?" : 'Agenda'}
        showProfileIcon={false}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder={language === 'en' ? 'Search events...' : 'Zoek evenementen...'}
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={loadEvents}
          />
        </View>
        <FilterButton onPress={() => setShowFilterModal(true)} filterCount={getActiveFilterCount()} />
      </View>

      <View style={styles.dateChipsContainer}>
        <FilterChips
          chips={dateChips}
          selectedChips={selectedDateFilter ? [selectedDateFilter] : []}
          onChipPress={handleDateFilterToggle}
        />
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

      <EventsFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onFiltersChange={setFilters}
        language={language}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{date}</Text>
            {dateEvents.map((event) => {
              let distance: number | undefined;
              if (profile?.location_lat && profile?.location_lng) {
                distance = calculateDistance(
                  profile.location_lat,
                  profile.location_lng,
                  event.location_lat,
                  event.location_lng
                );
              }

              return (
                <View key={event.id} style={styles.eventCard}>
                  <ActivityCard
                    id={event.id}
                    name={event.name}
                    city={event.city}
                    distance={distance}
                    image={event.images?.[0] || 'https://images.pexels.com/photos/1648387/pexels-photo-1648387.jpeg'}
                    rating={event.average_rating}
                    reviews={event.total_reviews}
                    priceMin={event.price_min}
                    priceMax={event.price_max}
                    isFree={event.is_free}
                    ageMin={event.age_min}
                    ageMax={event.age_max}
                    layout="horizontal"
                    type="event"
                    eventStartDatetime={event.event_start_datetime}
                  />
                  <Text style={styles.eventTime}>
                    {formatEventTime(event.event_start_datetime || '')}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}

        {events.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {language === 'en'
                ? 'No events found for the selected filters'
                : 'Geen evenementen gevonden voor de geselecteerde filters'}
            </Text>
          </View>
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
  dateChipsContainer: {
    marginTop: 12,
    marginBottom: 12,
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
  content: {
    flex: 1,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  eventCard: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  eventTime: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary,
    marginTop: 6,
    marginLeft: 132,
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
