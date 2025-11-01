import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface RatingDisplayProps {
  rating: number;
  reviewCount: number;
}

export default function RatingDisplay({ rating, reviewCount }: RatingDisplayProps) {
  return (
    <View style={styles.ratingRow}>
      <Star size={20} color={Colors.warning} fill={Colors.warning} />
      <Text style={styles.rating}>
        {rating.toFixed(1)} ({reviewCount} reviews)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
