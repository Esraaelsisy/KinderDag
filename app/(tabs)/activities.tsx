import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Calendar as CalendarIcon, Clock, MapPin, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface ScheduledActivity {
  id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  notes: string | null;
  activity: {
    id: string;
    name: string;
    city: string;
    address: string;
  };
}

export default function ActivitiesScreen() {
  const [scheduledActivities, setScheduledActivities] = useState<ScheduledActivity[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadScheduledActivities();
    }
  }, [user]);

  const loadScheduledActivities = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('scheduled_activities')
      .select('id, scheduled_date, scheduled_time, notes, activity:activities(id, name, city, address)')
      .eq('profile_id', user.id)
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true });

    if (data) {
      setScheduledActivities(data as any);
    }
  };

  const deleteScheduledActivity = async (id: string) => {
    await supabase.from('scheduled_activities').delete().eq('id', id);
    loadScheduledActivities();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadScheduledActivities();
    setRefreshing(false);
  };

  const renderActivity = ({ item }: { item: ScheduledActivity }) => (
    <View style={styles.activityCard}>
      <TouchableOpacity
        style={styles.activityContent}
        onPress={() => router.push(`/activity/${item.activity.id}`)}
      >
        <View style={styles.dateBox}>
          <Text style={styles.dateDay}>
            {new Date(item.scheduled_date).getDate()}
          </Text>
          <Text style={styles.dateMonth}>
            {new Date(item.scheduled_date).toLocaleDateString('en-US', {
              month: 'short',
            })}
          </Text>
        </View>
        <View style={styles.activityInfo}>
          <Text style={styles.activityName}>{item.activity.name}</Text>
          <View style={styles.activityDetails}>
            <View style={styles.detailRow}>
              <MapPin size={14} color="#64748b" />
              <Text style={styles.detailText}>{item.activity.city}</Text>
            </View>
            {item.scheduled_time && (
              <View style={styles.detailRow}>
                <Clock size={14} color="#64748b" />
                <Text style={styles.detailText}>{item.scheduled_time}</Text>
              </View>
            )}
          </View>
          {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteScheduledActivity(item.id)}
      >
        <Trash2 size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.activities')}</Text>
        <Text style={styles.subtitle}>Your scheduled activities</Text>
      </View>

      {scheduledActivities.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <CalendarIcon size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No Scheduled Activities</Text>
          <Text style={styles.emptyText}>
            Add activities to your schedule from the activity details page
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={scheduledActivities}
          renderItem={renderActivity}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
  list: {
    padding: 20,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
  },
  dateBox: {
    width: 60,
    height: 60,
    backgroundColor: '#1ABC9C',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  activityDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#64748b',
  },
  notes: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
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
