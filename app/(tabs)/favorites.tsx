import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import ActivityCard from '@/components/ActivityCard';
import { Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Activity } from '@/types';
import { favoritesService } from '@/services/favorites';
import { calculateDistance } from '@/utils/location';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<Activity[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;

    try {
      const data = await favoritesService.getAll(user.id);
      setFavorites(data);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const renderActivity = ({ item }: { item: Activity }) => {
    let distance: number | undefined;
    if (profile?.location_lat && profile?.location_lng) {
      distance = calculateDistance(
        profile.location_lat,
        profile.location_lng,
        item.location_lat,
        item.location_lng
      );
    }

    return (
      <View style={styles.cardWrapper}>
        <ActivityCard
          id={item.id}
          name={item.name}
          city={item.city}
          distance={distance}
          image={
            item.images?.[0] ||
            'https://images.pexels.com/photos/1648387/pexels-photo-1648387.jpeg'
          }
          rating={item.average_rating}
          reviews={item.total_reviews}
          priceMin={item.price_min}
          priceMax={item.price_max}
          isFree={item.is_free}
          ageMin={item.age_min}
          ageMax={item.age_max}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <Text style={styles.title}>{t('nav.favorites')}</Text>
      </LinearGradient>

      {favorites.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Heart size={64} color={Colors.mutedGrey} />
          <Text style={styles.emptyTitle}>{t('favorites.empty')}</Text>
          <Text style={styles.emptyText}>{t('favorites.addSome')}</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderActivity}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          numColumns={1}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
  },
  list: {
    padding: 20,
  },
  cardWrapper: {
    marginBottom: 16,
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});
