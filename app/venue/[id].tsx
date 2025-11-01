import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Navigation } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { detailPageStyles } from '@/styles/detailPageStyles';
import DetailPageHeader from '@/components/DetailPageHeader';
import InfoTags from '@/components/InfoTags';
import RatingDisplay from '@/components/RatingDisplay';
import LocationCard from '@/components/LocationCard';
import ContactButtons from '@/components/ContactButtons';
import CollectionTags from '@/components/CollectionTags';
import OpeningHoursDisplay from '@/components/OpeningHoursDisplay';
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
      .from('venues')
      .select(`
        *,
        place:place_id(*),
        venue_collection_links(collection:collections(*))
      `)
      .eq('id', id)
      .maybeSingle();

    if (data && !error) {
      const place = data.place || {};
      setVenue({
        id: data.id,
        name: place.name || '',
        description_en: data.description_en,
        description_nl: data.description_nl,
        city: place.city || '',
        province: place.province || '',
        address: place.address || '',
        location_lat: place.location_lat || 0,
        location_lng: place.location_lng || 0,
        phone: place.phone,
        email: place.email,
        website: place.website,
        images: data.images || [],
        venue_opening_hours: data.venue_opening_hours,
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
        collections: data.venue_collection_links?.map((vc: any) => vc.collection).filter(Boolean),
      });
    }
  };

  const checkFavorite = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('venue_id', id)
      .maybeSingle();
    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) {
      router.push('/signin');
      return;
    }

    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('venue_id', id);
      setIsFavorite(false);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, venue_id: id });
      setIsFavorite(true);
    }
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
      <View style={detailPageStyles.loadingContainer}>
        <Text style={detailPageStyles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const description = language === 'nl' ? venue.description_nl : venue.description_en;

  return (
    <View style={detailPageStyles.container}>
      <ScrollView style={detailPageStyles.scrollView} showsVerticalScrollIndicator={false}>
        <DetailPageHeader
          imageUrl={venue.images[0]}
          isFavorite={isFavorite}
          onFavoriteToggle={toggleFavorite}
        />

        <View style={detailPageStyles.content}>
          <View style={detailPageStyles.header}>
            <Text style={detailPageStyles.title}>{venue.name}</Text>

            {venue.venue_opening_hours && (
              <OpeningHoursDisplay
                openingHours={venue.venue_opening_hours}
                translations={{
                  openToday: t('venue.openToday'),
                  closed: t('venue.closed'),
                  dayNames: {
                    monday: t('venue.days.monday'),
                    tuesday: t('venue.days.tuesday'),
                    wednesday: t('venue.days.wednesday'),
                    thursday: t('venue.days.thursday'),
                    friday: t('venue.days.friday'),
                    saturday: t('venue.days.saturday'),
                    sunday: t('venue.days.sunday'),
                  },
                }}
              />
            )}

            <InfoTags
              ageMin={venue.age_min}
              ageMax={venue.age_max}
              isFree={venue.is_free}
              priceMin={venue.price_min}
              priceMax={venue.price_max}
              isIndoor={venue.is_indoor}
              isOutdoor={venue.is_outdoor}
              translations={{
                years: t('activity.years'),
                free: t('activity.free'),
                indoor: t('activity.indoor'),
                outdoor: t('activity.outdoor'),
              }}
            />

            <RatingDisplay rating={venue.average_rating} reviewCount={venue.total_reviews} />
          </View>

          {description && (
            <View style={detailPageStyles.section}>
              <Text style={detailPageStyles.sectionTitle}>{t('activity.about')}</Text>
              <Text style={detailPageStyles.description}>{description}</Text>
            </View>
          )}

          {venue.collections && venue.collections.length > 0 && (
            <View style={detailPageStyles.section}>
              <Text style={detailPageStyles.sectionTitle}>{t('activity.collections')}</Text>
              <CollectionTags collections={venue.collections} />
            </View>
          )}

          <View style={detailPageStyles.section}>
            <Text style={detailPageStyles.sectionTitle}>{t('activity.location')}</Text>
            <LocationCard address={venue.address} city={venue.city} province={venue.province} />
          </View>

          {(venue.phone || venue.email || venue.website) && (
            <View style={detailPageStyles.section}>
              <Text style={detailPageStyles.sectionTitle}>{t('activity.contact')}</Text>
              <ContactButtons
                phone={venue.phone}
                email={venue.email}
                website={venue.website}
                translations={{ visitWebsite: t('activity.visitWebsite') }}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <View style={detailPageStyles.footer}>
        <TouchableOpacity style={detailPageStyles.primaryButton} onPress={openMaps}>
          <Navigation size={20} color={Colors.white} />
          <Text style={detailPageStyles.primaryButtonText}>{t('venue.getDirections')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
