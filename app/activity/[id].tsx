import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
  TextInput,
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
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Activity {
  id: string;
  name: string;
  description_en: string;
  description_nl: string;
  city: string;
  address: string;
  province: string;
  images: string[];
  average_rating: number;
  total_reviews: number;
  price_min: number;
  price_max: number;
  is_free: boolean;
  age_min: number;
  age_max: number;
  is_indoor: boolean;
  is_outdoor: boolean;
  phone: string | null;
  website: string | null;
  booking_url: string | null;
  opening_hours: any;
}

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [notes, setNotes] = useState('');
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      loadActivity();
      checkFavorite();
    }
  }, [id]);

  const loadActivity = async () => {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (data) {
      setActivity(data);
    }
  };

  const checkFavorite = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('profile_id', user.id)
      .eq('activity_id', id)
      .maybeSingle();

    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to save favorites');
      return;
    }

    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('profile_id', user.id)
        .eq('activity_id', id);
      setIsFavorite(false);
    } else {
      await supabase.from('favorites').insert({
        profile_id: user.id,
        activity_id: id,
      });
      setIsFavorite(true);
    }
  };

  const scheduleActivity = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to schedule activities');
      return;
    }

    if (!scheduleDate) {
      Alert.alert('Date Required', 'Please select a date for the activity');
      return;
    }

    await supabase.from('scheduled_activities').insert({
      profile_id: user.id,
      activity_id: id,
      scheduled_date: scheduleDate,
      scheduled_time: scheduleTime || null,
      notes: notes || null,
    });

    Alert.alert('Success', 'Activity added to your schedule');
    setShowScheduleModal(false);
    setScheduleDate('');
    setScheduleTime('');
    setNotes('');
  };

  const openUrl = (url: string | null) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  if (!activity) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const description = language === 'en' ? activity.description_en : activity.description_nl;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                activity.images?.[0] ||
                'https://images.pexels.com/photos/1648387/pexels-photo-1648387.jpeg',
            }}
            style={styles.image}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent']}
            style={styles.imageOverlay}
          />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
            <Heart
              size={24}
              color="#ffffff"
              fill={isFavorite ? '#ffffff' : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{activity.name}</Text>
            <View style={styles.ratingRow}>
              <Star size={20} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.rating}>
                {activity.average_rating.toFixed(1)} ({activity.total_reviews} {t('activity.reviews')})
              </Text>
            </View>
          </View>

          <View style={styles.tags}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>
                {activity.age_min}-{activity.age_max}y
              </Text>
            </View>
            {activity.is_indoor && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{t('activity.indoor')}</Text>
              </View>
            )}
            {activity.is_outdoor && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{t('activity.outdoor')}</Text>
              </View>
            )}
            {activity.is_free ? (
              <View style={[styles.tag, styles.tagFree]}>
                <Text style={styles.tagTextFree}>{t('activity.free')}</Text>
              </View>
            ) : (
              <View style={styles.priceTag}>
                <Euro size={16} color="#10B981" />
                <Text style={styles.priceText}>
                  {activity.price_min === activity.price_max
                    ? activity.price_min
                    : `${activity.price_min}-${activity.price_max}`}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationRow}>
              <MapPin size={20} color="#64748b" />
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>{activity.address}</Text>
                <Text style={styles.locationSubtext}>
                  {activity.city}, {activity.province}
                </Text>
              </View>
            </View>
          </View>

          {(activity.phone || activity.website) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact</Text>
              {activity.phone && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => Linking.openURL(`tel:${activity.phone}`)}
                >
                  <Phone size={20} color="#64748b" />
                  <Text style={styles.contactText}>{activity.phone}</Text>
                </TouchableOpacity>
              )}
              {activity.website && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => openUrl(activity.website)}
                >
                  <Globe size={20} color="#64748b" />
                  <Text style={styles.contactText}>{activity.website}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.scheduleButton}
              onPress={() => setShowScheduleModal(true)}
            >
              <Calendar size={20} color="#10B981" />
              <Text style={styles.scheduleButtonText}>Add to Schedule</Text>
            </TouchableOpacity>
            {activity.booking_url && (
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => openUrl(activity.booking_url)}
              >
                <Text style={styles.bookButtonText}>{t('activity.book')}</Text>
                <ExternalLink size={20} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showScheduleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule Activity</Text>
            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor="#94a3b8"
              value={scheduleDate}
              onChangeText={setScheduleDate}
            />
            <TextInput
              style={styles.input}
              placeholder="Time (HH:MM) - Optional"
              placeholderTextColor="#94a3b8"
              value={scheduleTime}
              onChangeText={setScheduleTime}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes - Optional"
              placeholderTextColor="#94a3b8"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowScheduleModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={scheduleActivity}>
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rating: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 13,
    color: '#0369a1',
    fontWeight: '600',
  },
  tagFree: {
    backgroundColor: '#d1fae5',
  },
  tagTextFree: {
    fontSize: 13,
    color: '#065f46',
    fontWeight: '600',
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  priceText: {
    fontSize: 13,
    color: '#065f46',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 15,
    color: '#10B981',
    textDecorationLine: 'underline',
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  scheduleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
