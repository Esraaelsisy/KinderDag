import { useState, useEffect } from 'react';
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
import { Search } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import FilterChips from '@/components/FilterChips';
import ActivityCard from '@/components/ActivityCard';
import { eventsService } from '@/services/events';
import { Event } from '@/types';

type DateFilter = 'today' | 'tomorrow' | 'weekend' | 'month';

export default function EventsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('weekend');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const { language } = useLanguage();
  const { profile } = useAuth();

  const dateChips = [
    { id: 'today', label: language === 'en' ? 'Today' : 'Vandaag', value: 'today' },
    { id: 'tomorrow', label: language === 'en' ? 'Tomorrow' : 'Morgen', value: 'tomorrow' },
    { id: 'weekend', label: language === 'en' ? 'Weekend' : 'Weekend', value: 'weekend' },
    { id: 'month', label: language === 'en' ? 'This Month' : 'Deze Maand', value: 'month' },
  ];

  const filterChips = [
    { id: 'free', label: language === 'en' ? 'Free' : 'Gratis', value: true },
    { id: 'under10', label: '< €10', value: '10' },
    { id: 'age0-3', label: '0-3y', value: '0-3' },
    { id: 'age4-7', label: '4-7y', value: '4-7' },
    { id: 'age8-12', label: '8-12y', value: '8-12' },
    { id: 'seasonal', label: language === 'en' ? 'Seasonal' : 'Seizoensgebonden', value: 'seasonal' },
  ];

  useEffect(() => {
    loadEvents();
  }, [selectedDateFilter, selectedFilters, profile?.location_name]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const dateRange = getDateRange(selectedDateFilter);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);

      let allEvents = searchQuery.trim()
        ? await eventsService.search(searchQuery)
        : await eventsService.getByDateRange(startDate, endDate);

      if (profile?.location_name) {
        allEvents = allEvents.filter(e => e.city === profile.location_name);
      }

      if (selectedFilters.includes('free')) {
        allEvents = allEvents.filter(e => e.is_free);
      }

      if (selectedFilters.includes('under10')) {
        allEvents = allEvents.filter(e => e.price_max <= 10);
      }

      if (selectedFilters.includes('age0-3')) {
        allEvents = allEvents.filter(e => e.age_min <= 3);
      } else if (selectedFilters.includes('age4-7')) {
        allEvents = allEvents.filter(e => e.age_max >= 4 && e.age_min <= 7);
      } else if (selectedFilters.includes('age8-12')) {
        allEvents = allEvents.filter(e => e.age_max >= 8 && e.age_min <= 12);
      }

      allEvents.sort((a, b) =>
        new Date(a.event_start_datetime).getTime() - new Date(b.event_start_datetime).getTime()
      );

      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (filter: DateFilter) => {
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
        const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
        start.setDate(start.getDate() + daysUntilSaturday);
        end.setDate(start.getDate() + 1);
        end.setHours(23, 59, 59, 999);
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

  const handleFilterToggle = (chipId: string) => {
    setSelectedFilters(prev =>
      prev.includes(chipId) ? prev.filter(id => id !== chipId) : [...prev, chipId]
    );
  };

  const handleDateFilterToggle = (chipId: string) => {
    setSelectedDateFilter(chipId as DateFilter);
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
        title={language === 'en' ? "What's On" : 'Agenda'}
        showProfileIcon={true}
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
      </View>

      <View style={styles.dateChipsContainer}>
        <FilterChips
          chips={dateChips}
          selectedChips={[selectedDateFilter]}
          onChipPress={handleDateFilterToggle}
        />
      </View>

      <View style={styles.filterChipsContainer}>
        <FilterChips
          chips={filterChips}
          selectedChips={selectedFilters}
          onChipPress={handleFilterToggle}
        />
      </View>

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
  dateChipsContainer: {
    marginVertical: 12,
  },
  filterChipsContainer: {
    marginBottom: 16,
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
