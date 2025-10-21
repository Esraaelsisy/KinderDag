import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Star, Euro } from 'lucide-react-native';
import { useRouter } from 'expo-router';

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
          <MapPin size={14} color="#64748b" />
          <Text style={styles.location}>
            {city}
            {distance && ` • ${distance.toFixed(1)}km`}
          </Text>
        </View>
        <View style={styles.footer}>
          <View style={styles.row}>
            <Star size={14} color="#fbbf24" fill="#fbbf24" />
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
                <Euro size={12} color="#10B981" />
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
    backgroundColor: '#ffffff',
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
    backgroundColor: '#e2e8f0',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 13,
    color: '#64748b',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  rating: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '600',
  },
  tagFree: {
    backgroundColor: '#d1fae5',
  },
  tagTextFree: {
    fontSize: 11,
    color: '#065f46',
    fontWeight: '600',
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 2,
  },
  priceText: {
    fontSize: 11,
    color: '#065f46',
    fontWeight: '600',
  },
});
