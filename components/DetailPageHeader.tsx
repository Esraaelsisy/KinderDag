import { View, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';

interface DetailPageHeaderProps {
  imageUrl: string;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
}

export default function DetailPageHeader({
  imageUrl,
  isFavorite,
  onFavoriteToggle,
}: DetailPageHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: imageUrl || 'https://via.placeholder.com/400x300' }}
        style={styles.image}
      />
      <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.gradient} />
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={24} color={Colors.white} strokeWidth={2.5} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.favoriteButton} onPress={onFavoriteToggle}>
        <Heart
          size={24}
          color={Colors.white}
          fill={isFavorite ? Colors.white : 'transparent'}
          strokeWidth={2.5}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
