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
  Clock,
  Phone,
  Globe,
  ExternalLink,
  Navigation,
  Mail,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import type { Venue } from '@/types';

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      loadVenue();
      checkFavorite();
    }
  }, [id]);

  const loadVenue = async () => {
    const { data, error } = await supabase
      .from('places')
      .select(`
        *,
        place_categories(category:categories(*)),
        place_collections(collection:collections(*))
      `)
      .eq('id', id)
      .maybeSingle();

    if (data && !error) {
      setVenue({
        id: data.id,
        name: data.name,
        description_en: data.description_en,
        description_nl: data.description_nl,
        city: data.city,
        province: data.province,
        address: data.address,
        location_lat: data.location_lat,
        location_lng: data.location_lng,
        phone: data.phone,
        email: data.email,
        website: data.website,
        images: data.images || [],
        venue_opening_hours: data.opening_hours,
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
        is_seasonal: data.is_seasonal || false,
        season_start: data.season_start,
        season_end: data.season_end,
        categories: data.place_categories?.map((pc: any) => pc.category?.name).filter(Boolean),
        collections: data.place_collections?.map((pc: any) => pc.collection).filter(Boolean),
      });
    }
  };

  const checkFavorite = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('place_id', id)
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
        .eq('place_id', id);
      setIsFavorite(false);
    } else {
      await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          place_id: id,
        });
      setIsFavorite(true);
    }
  };

  const getTodayOpeningHours = () => {
    if (!venue?.venue_opening_hours) return null;

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const hours = venue.venue_opening_hours[today];

    if (!hours || hours.closed) {
      return t('venue.closed');
    }

    return `${hours.open} - ${hours.close}`;
  };

  const openMaps = () => {
    if (!venue) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${venue.address}`,
      android: `geo:0,0?q=${venue.address}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`,
    });
    Linking.openURL(url);
  };

  if (!venue) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const description = language === 'nl' ? venue.description_nl : venue.description_en;
  const todayHours = getTodayOpeningHours();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: venue.images[0] || 'https://via.placeholder.com/400x300' }}
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
            <Text style={styles.title}>{venue.name}</Text>

            {todayHours && (
              <View style={styles.hoursCard}>
                <Clock size={20} color={Colors.primary} />
                <View style={styles.hoursTextContainer}>
                  <Text style={styles.hoursLabel}>{t('venue.openToday')}</Text>
                  <Text style={styles.hoursText}>{todayHours}</Text>
                </View>
              </View>
            )}

            <View style={styles.tagsRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {venue.age_min}-{venue.age_max} {t('activity.years')}
                </Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {venue.is_free ? t('activity.free') : `€${venue.price_min}-€${venue.price_max}`}
                </Text>
              </View>
              {venue.is_indoor && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{t('activity.indoor')}</Text>
                </View>
              )}
              {venue.is_outdoor && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{t('activity.outdoor')}</Text>
                </View>
              )}
            </View>

            <View style={styles.ratingRow}>
              <Star size={20} color={Colors.warning} fill={Colors.warning} />
              <Text style={styles.rating}>
                {venue.average_rating.toFixed(1)} ({venue.total_reviews} reviews)
              </Text>
            </View>
          </View>

          {description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('activity.about')}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
          )}

          {venue.collections && venue.collections.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('activity.collections')}</Text>
              <View style={styles.collectionsContainer}>
                {venue.collections.map((collection) => (
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

          {venue.venue_opening_hours && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('venue.openingHours')}</Text>
              <View style={styles.openingHoursContainer}>
                {Object.entries(venue.venue_opening_hours).map(([day, hours]: [string, any]) => (
                  <View key={day} style={styles.openingHoursRow}>
                    <Text style={styles.dayText}>
                      {t(`venue.days.${day}`)}
                    </Text>
                    <Text style={styles.hoursValueText}>
                      {hours.closed ? t('venue.closed') : `${hours.open} - ${hours.close}`}
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
                  <Text style={styles.locationText}>{venue.address}</Text>
                  <Text style={styles.locationSubtext}>
                    {venue.city}, {venue.province}
                  </Text>
                </View>
              </View>
              <Navigation size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {(venue.phone || venue.email || venue.website) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('activity.contact')}</Text>
              {venue.phone && (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => Linking.openURL(`tel:${venue.phone}`)}
                >
                  <Phone size={20} color={Colors.primary} />
                  <Text style={styles.contactButtonText}>{venue.phone}</Text>
                </TouchableOpacity>
              )}
              {venue.email && (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => Linking.openURL(`mailto:${venue.email}`)}
                >
                  <Mail size={20} color={Colors.primary} />
                  <Text style={styles.contactButtonText}>{venue.email}</Text>
                </TouchableOpacity>
              )}
              {venue.website && (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => Linking.openURL(venue.website!)}
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

      <View style={styles.footer}>
        <TouchableOpacity style={styles.directionsButton} onPress={openMaps}>
          <Navigation size={20} color={Colors.white} />
          <Text style={styles.directionsButtonText}>{t('venue.getDirections')}</Text>
        </TouchableOpacity>
      </View>
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
  hoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  hoursTextContainer: {
    flex: 1,
  },
  hoursLabel: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  hoursText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: 'bold',
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
  openingHoursContainer: {
    backgroundColor: Colors.lightGrey,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  openingHoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  hoursValueText: {
    fontSize: 15,
    color: Colors.textLight,
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
  directionsButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  directionsButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
});
