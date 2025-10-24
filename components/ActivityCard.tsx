import { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Star, Euro, Heart, Calendar, Clock, Sun, Home as HomeIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { favoritesService } from '@/services/favorites';

interface ActivityCardProps {
  id: string;
  name: string;
  city: string;
  distance?: number;
  image: string;
  rating: number;
  reviewCount?: number;
  reviews?: number;
  priceMin: number;
  priceMax: number;
  isFree: boolean;
  ageMin: number;
  ageMax: number;
  layout?: 'vertical' | 'horizontal';
  type?: 'event' | 'venue';
  eventStartDatetime?: string;
  eventEndDatetime?: string;
  isIndoor?: boolean;
  isOutdoor?: boolean;
  isOpen?: boolean;
  seasonalBadge?: string;
}

export default function ActivityCard({
  id,
  name,
  city,
  distance,
  image,
  rating,
  reviewCount,
  reviews,
  priceMin,
  priceMax,
  isFree,
  ageMin,
  ageMax,
  layout = 'vertical',
  type = 'venue',
}: ActivityCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const reviewsCount = reviewCount || reviews || 0;

  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, id, type]);

  const checkFavoriteStatus = async () => {
    if (!user) return;
    try {
      const favorited = type === 'venue'
        ? await favoritesService.isFavoritedVenue(user.id, id)
        : await favoritesService.isFavoritedEvent(user.id, id);
      setIsFavorite(favorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleFavoriteToggle = async (e: any) => {
    e.stopPropagation();

    if (!user || isToggling) return;

    setIsToggling(true);
    const previousState = isFavorite;
    setIsFavorite(!isFavorite);

    try {
      if (type === 'venue') {
        await favoritesService.toggleVenue(user.id, id);
      } else {
        await favoritesService.toggleEvent(user.id, id);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setIsFavorite(previousState);
    } finally {
      setIsToggling(false);
    }
  };

  if (layout === 'horizontal') {
    return (
      <TouchableOpacity
        style={styles.cardHorizontal}
        onPress={() => router.push(`/activity/${id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainerHorizontal}>
          <Image source={{ uri: image }} style={styles.imageHorizontal} />
        </View>
        <View style={styles.contentHorizontal}>
          <View style={styles.headerRow}>
            <Text style={styles.nameHorizontal} numberOfLines={2}>
              {name}
            </Text>
            {user && (
              <TouchableOpacity
                style={styles.favoriteButtonHorizontal}
                onPress={handleFavoriteToggle}
                activeOpacity={0.7}
              >
                <Heart
                  size={18}
                  color={isFavorite ? Colors.primary : Colors.textLight}
                  fill={isFavorite ? Colors.primary : 'transparent'}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.rowHorizontal}>
            <MapPin size={14} color={Colors.textLight} />
            <Text style={styles.locationHorizontal} numberOfLines={1}>
              {city}
            </Text>
          </View>
          <View style={styles.footerHorizontal}>
            <View style={styles.rowHorizontal}>
              <Star size={14} color={Colors.warning} fill={Colors.warning} />
              <Text style={styles.ratingHorizontal}>
                {rating.toFixed(1)} ({reviewsCount})
              </Text>
            </View>
            <View style={styles.tagsHorizontal}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {ageMin}+
                </Text>
              </View>
              {isFree ? (
                <View style={[styles.tag, styles.tagFree]}>
                  <Text style={styles.tagTextFree}>Free</Text>
                </View>
              ) : (
                <View style={styles.priceTag}>
                  <Euro size={12} color={Colors.primary} />
                  <Text style={styles.priceText}>
                    {priceMin === priceMax ? priceMin : `${priceMin}-${priceMax}`}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/activity/${id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: image }} style={styles.image} />
        {user && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoriteToggle}
            activeOpacity={0.7}
          >
            <Heart
              size={20}
              color={isFavorite ? Colors.primary : Colors.white}
              fill={isFavorite ? Colors.primary : 'transparent'}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.row}>
          <MapPin size={14} color={Colors.textLight} />
          <Text style={styles.location}>
            {city}
            {distance && ` • ${distance.toFixed(1)}km`}
          </Text>
        </View>
        <View style={styles.footer}>
          <View style={styles.row}>
            <Star size={14} color={Colors.warning} fill={Colors.warning} />
            <Text style={styles.rating}>
              {rating.toFixed(1)} ({reviewsCount})
            </Text>
          </View>
          <View style={styles.tags}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>
                {ageMin}+
              </Text>
            </View>
            {isFree ? (
              <View style={[styles.tag, styles.tagFree]}>
                <Text style={styles.tagTextFree}>Free</Text>
              </View>
            ) : (
              <View style={styles.priceTag}>
                <Euro size={12} color={Colors.primary} />
                <Text style={styles.priceText}>
                  {priceMin === priceMax ? priceMin : `${priceMin}-${priceMax}`}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    width: 280,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.border,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 13,
    color: Colors.textLight,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  rating: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: '600',
  },
  tagFree: {
    backgroundColor: Colors.accent,
  },
  tagTextFree: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '600',
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 2,
  },
  priceText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  cardHorizontal: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    height: 120,
  },
  imageContainerHorizontal: {
    width: 120,
    height: 120,
  },
  imageHorizontal: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.border,
  },
  contentHorizontal: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  nameHorizontal: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  favoriteButtonHorizontal: {
    padding: 4,
  },
  rowHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationHorizontal: {
    fontSize: 12,
    color: Colors.textLight,
    flex: 1,
  },
  footerHorizontal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingHorizontal: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '600',
  },
  tagsHorizontal: {
    flexDirection: 'row',
    gap: 6,
  },
});
