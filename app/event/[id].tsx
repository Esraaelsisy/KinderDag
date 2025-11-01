import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { detailPageStyles } from '@/styles/detailPageStyles';
import DetailPageHeader from '@/components/DetailPageHeader';
import InfoTags from '@/components/InfoTags';
import RatingDisplay from '@/components/RatingDisplay';
import LocationCard from '@/components/LocationCard';
import ContactButtons from '@/components/ContactButtons';
import CollectionTags from '@/components/CollectionTags';
import type { Event } from '@/types';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      loadEvent();
      checkFavorite();
    }
  }, [id]);

  const loadEvent = async () => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        place:place_id(*),
        event_collection_links(collection:collections(*))
      `)
      .eq('id', id)
      .maybeSingle();

    if (data && !error) {
      const place = data.place || {};
      setEvent({
        id: data.id,
        name: data.event_name || 'Event',
        description_en: data.description_en,
        description_nl: data.description_nl,
        city: place.city || data.custom_city || '',
        province: place.province || data.custom_province || '',
        address: place.address || data.custom_address || '',
        location_lat: place.location_lat || data.custom_lat || 0,
        location_lng: place.location_lng || data.custom_lng || 0,
        phone: place.phone,
        email: place.email,
        website: place.website,
        images: data.images || [],
        event_start_datetime: data.event_start_datetime,
        event_end_datetime: data.event_end_datetime,
        average_rating: data.average_rating || 0,
        total_reviews: data.total_reviews || 0,
        price_min: data.price_min || 0,
        price_max: data.price_max || 0,
        is_free: data.is_free || false,
        age_min: data.age_min || 0,
        age_max: data.age_max || 18,
        is_indoor: data.is_indoor || false,
        is_outdoor: data.is_outdoor || false,
        weather_dependent: data.weather_dependent || false,
        booking_url: data.booking_url,
        is_featured: data.is_featured || false,
        collections: data.event_collection_links?.map((ec: any) => ec.collection).filter(Boolean),
      });
    }
  };

  const checkFavorite = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', id)
      .maybeSingle();
    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) {
      router.push('/signin');
      return;
    }

    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('event_id', id);
      setIsFavorite(false);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, event_id: id });
      setIsFavorite(true);
    }
  };

  const formatEventDateTime = (startDateTime: string, endDateTime: string) => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const isSameDay = start.toDateString() === end.toDateString();

    const dateFormat: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    };
    const timeFormat: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

    if (isSameDay) {
      return {
        date: start.toLocaleDateString('nl-NL', dateFormat),
        time: `${start.toLocaleTimeString('nl-NL', timeFormat)} - ${end.toLocaleTimeString('nl-NL', timeFormat)}`,
      };
    }
    return {
      date: `${start.toLocaleDateString('nl-NL', dateFormat)} - ${end.toLocaleDateString('nl-NL', dateFormat)}`,
      time: `${start.toLocaleTimeString('nl-NL', timeFormat)} - ${end.toLocaleTimeString('nl-NL', timeFormat)}`,
    };
  };

  if (!event) {
    return (
      <View style={detailPageStyles.loadingContainer}>
        <Text style={detailPageStyles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const description = language === 'nl' ? event.description_nl : event.description_en;
  const dateTime = formatEventDateTime(event.event_start_datetime, event.event_end_datetime);

  return (
    <View style={detailPageStyles.container}>
      <ScrollView style={detailPageStyles.scrollView} showsVerticalScrollIndicator={false}>
        <DetailPageHeader
          imageUrl={event.images[0]}
          isFavorite={isFavorite}
          onFavoriteToggle={toggleFavorite}
        />

        <View style={detailPageStyles.content}>
          <View style={detailPageStyles.header}>
            <Text style={detailPageStyles.title}>{event.name}</Text>

            <View style={styles.dateTimeCard}>
              <View style={styles.dateTimeRow}>
                <Calendar size={20} color={Colors.primary} />
                <Text style={styles.dateTimeText}>{dateTime.date}</Text>
              </View>
              <View style={styles.dateTimeRow}>
                <Clock size={20} color={Colors.primary} />
                <Text style={styles.dateTimeText}>{dateTime.time}</Text>
              </View>
            </View>

            <InfoTags
              ageMin={event.age_min}
              ageMax={event.age_max}
              isFree={event.is_free}
              priceMin={event.price_min}
              priceMax={event.price_max}
              isIndoor={event.is_indoor}
              isOutdoor={event.is_outdoor}
              translations={{
                years: t('activity.years'),
                free: t('activity.free'),
                indoor: t('activity.indoor'),
                outdoor: t('activity.outdoor'),
              }}
            />

            <RatingDisplay rating={event.average_rating} reviewCount={event.total_reviews} />
          </View>

          {description && (
            <View style={detailPageStyles.section}>
              <Text style={detailPageStyles.sectionTitle}>{t('activity.about')}</Text>
              <Text style={detailPageStyles.description}>{description}</Text>
            </View>
          )}

          {event.collections && event.collections.length > 0 && (
            <View style={detailPageStyles.section}>
              <Text style={detailPageStyles.sectionTitle}>{t('activity.collections')}</Text>
              <CollectionTags collections={event.collections} />
            </View>
          )}

          <View style={detailPageStyles.section}>
            <Text style={detailPageStyles.sectionTitle}>{t('activity.location')}</Text>
            <LocationCard address={event.address} city={event.city} province={event.province} />
          </View>

          {(event.phone || event.website) && (
            <View style={detailPageStyles.section}>
              <Text style={detailPageStyles.sectionTitle}>{t('activity.contact')}</Text>
              <ContactButtons
                phone={event.phone}
                website={event.website}
                translations={{ visitWebsite: t('activity.visitWebsite') }}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {event.booking_url && (
        <View style={detailPageStyles.footer}>
          <TouchableOpacity
            style={detailPageStyles.primaryButton}
            onPress={() => Linking.openURL(event.booking_url!)}
          >
            <Text style={detailPageStyles.primaryButtonText}>{t('activity.bookTickets')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  dateTimeCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateTimeText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
});
