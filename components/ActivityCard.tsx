import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Star, Euro } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';

interface ActivityCardProps {
  id: string;
  name: string;
  city: string;
  distance?: number;
  image: string;
  rating: number;
  reviews: number;
  priceMin: number;
  priceMax: number;
  isFree: boolean;
  ageMin: number;
  ageMax: number;
}

export default function ActivityCard({
  id,
  name,
  city,
  distance,
  image,
  rating,
  reviews,
  priceMin,
  priceMax,
  isFree,
  ageMin,
  ageMax,
}: ActivityCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/activity/${id}`)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: image }} style={styles.image} />
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
              {rating.toFixed(1)} ({reviews})
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
    marginRight: 16,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.border,
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
    backgroundColor: '#E8D5F2',
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
});
