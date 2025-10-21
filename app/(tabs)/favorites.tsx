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
import { supabase } from '@/lib/supabase';
import ActivityCard from '@/components/ActivityCard';
import { Heart, Settings } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface Favorite {
  id: string;
  activity: {
    id: string;
    name: string;
    city: string;
    images: string[];
    average_rating: number;
    total_reviews: number;
    price_min: number;
    price_max: number;
    is_free: boolean;
    age_min: number;
    age_max: number;
    location_lat: number;
    location_lng: number;
  };
}

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('favorites')
      .select('id, activity:activities(*)')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setFavorites(data as any);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const renderActivity = ({ item }: { item: Favorite }) => {
    let distance: number | undefined;
    if (profile?.location_lat && profile?.location_lng) {
      distance = calculateDistance(
        profile.location_lat,
        profile.location_lng,
        item.activity.location_lat,
        item.activity.location_lng
      );
    }

    return (
      <View style={styles.cardWrapper}>
        <ActivityCard
          id={item.activity.id}
          name={item.activity.name}
          city={item.activity.city}
          distance={distance}
          image={
            item.activity.images?.[0] ||
            'https://images.pexels.com/photos/1648387/pexels-photo-1648387.jpeg'
          }
          rating={item.activity.average_rating}
          reviews={item.activity.total_reviews}
          priceMin={item.activity.price_min}
          priceMax={item.activity.price_max}
          isFree={item.activity.is_free}
          ageMin={item.activity.age_min}
          ageMax={item.activity.age_max}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('nav.favorites')}</Text>
          {profile && (
            <Text style={styles.subtitle}>
              {profile.full_name} • {profile.location_name || 'Netherlands'}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={signOut}>
          <Settings size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      {favorites.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Heart size={64} color="#cbd5e1" />
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
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  settingsButton: {
    padding: 8,
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
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});
