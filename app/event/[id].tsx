import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  Heart,
  MapPin,
  Star,
  Euro,
  Calendar,
  Clock,
  Phone,
  Globe,
  ExternalLink,
  Navigation,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
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
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', id);
      setIsFavorite(false);
    } else {
      await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          event_id: id,
        });
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

    const timeFormat: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };

    if (isSameDay) {
      return {
        date: start.toLocaleDateString('nl-NL', dateFormat),
        time: `${start.toLocaleTimeString('nl-NL', timeFormat)} - ${end.toLocaleTimeString('nl-NL', timeFormat)}`,
      };
    } else {
      return {
        date: `${start.toLocaleDateString('nl-NL', dateFormat)} - ${end.toLocaleDateString('nl-NL', dateFormat)}`,
        time: `${start.toLocaleTimeString('nl-NL', timeFormat)} - ${end.toLocaleTimeString('nl-NL', timeFormat)}`,
      };
    }
  };

  const openMaps = () => {
    if (!event) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${event.address}`,
      android: `geo:0,0?q=${event.address}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`,
    });
    Linking.openURL(url);
  };

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const description = language === 'nl' ? event.description_nl : event.description_en;
  const dateTime = formatEventDateTime(event.event_start_datetime, event.event_end_datetime);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: event.images[0] || 'https://via.placeholder.com/400x300' }}
            style={styles.image}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']}
            style={styles.gradient}
          />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
            <Heart
              size={24}
              color={Colors.white}
              fill={isFavorite ? Colors.white : 'transparent'}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{event.name}</Text>

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

            <View style={styles.tagsRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {event.age_min}-{event.age_max} {t('activity.years')}
                </Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {event.is_free ? t('activity.free') : `€${event.price_min}-€${event.price_max}`}
                </Text>
              </View>
              {event.is_indoor && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{t('activity.indoor')}</Text>
                </View>
              )}
              {event.is_outdoor && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{t('activity.outdoor')}</Text>
                </View>
              )}
            </View>

            <View style={styles.ratingRow}>
              <Star size={20} color={Colors.warning} fill={Colors.warning} />
              <Text style={styles.rating}>
                {event.average_rating.toFixed(1)} ({event.total_reviews} reviews)
              </Text>
            </View>
          </View>

          {description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('activity.about')}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
          )}

          {event.collections && event.collections.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('activity.collections')}</Text>
              <View style={styles.collectionsContainer}>
                {event.collections.map((collection) => (
                  <View
                    key={collection.id}
                    style={[styles.collectionTag, { backgroundColor: collection.color + '20' }]}
                  >
                    <Text style={[styles.collectionTagText, { color: collection.color }]}>
                      {collection.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('activity.location')}</Text>
            <TouchableOpacity style={styles.locationCard} onPress={openMaps}>
              <View style={styles.locationInfo}>
                <MapPin size={20} color={Colors.primary} />
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationText}>{event.address}</Text>
                  <Text style={styles.locationSubtext}>
                    {event.city}, {event.province}
                  </Text>
                </View>
              </View>
              <Navigation size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {(event.phone || event.website) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('activity.contact')}</Text>
              {event.phone && (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => Linking.openURL(`tel:${event.phone}`)}
                >
                  <Phone size={20} color={Colors.primary} />
                  <Text style={styles.contactButtonText}>{event.phone}</Text>
                </TouchableOpacity>
              )}
              {event.website && (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => Linking.openURL(event.website!)}
                >
                  <Globe size={20} color={Colors.primary} />
                  <Text style={styles.contactButtonText}>{t('activity.visitWebsite')}</Text>
                  <ExternalLink size={16} color={Colors.textLight} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {event.booking_url && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => Linking.openURL(event.booking_url!)}
          >
            <Text style={styles.bookButtonText}>{t('activity.bookTickets')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 100,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
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
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: Colors.lightGrey,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rating: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.textLight,
  },
  collectionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  collectionTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  collectionTagText: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.lightGrey,
    padding: 16,
    borderRadius: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationSubtext: {
    fontSize: 14,
    color: Colors.textLight,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.lightGrey,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  contactButtonText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
});
