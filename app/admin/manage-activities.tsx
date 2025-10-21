import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Edit, Trash2, MapPin } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';

interface Activity {
  id: string;
  name: string;
  city: string;
  province: string;
  is_featured: boolean;
  created_at: string;
}

export default function ManageActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('id, name, city, province, is_featured, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setActivities(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load activities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleDelete(activity: Activity) {
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete "${activity.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('activities')
                .delete()
                .eq('id', activity.id);

              if (error) throw error;

              setActivities((prev) => prev.filter((a) => a.id !== activity.id));
              Alert.alert('Success', 'Activity deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete activity');
            }
          },
        },
      ]
    );
  }

  function handleEdit(activityId: string) {
    router.push(`/admin/edit-activity/${activityId}`);
  }

  function handleRefresh() {
    setRefreshing(true);
    loadActivities();
  }

  function renderActivity({ item }: { item: Activity }) {
    return (
      <View style={styles.activityCard}>
        <View style={styles.activityInfo}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.is_featured && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            )}
          </View>
          <View style={styles.locationRow}>
            <MapPin color="#64748b" size={14} />
            <Text style={styles.locationText}>
              {item.city}
              {item.province ? `, ${item.province}` : ''}
            </Text>
          </View>
        </View>
        <View style={styles.activityActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item.id)}
          >
            <Edit color={colors.primary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
          >
            <Trash2 color="#ef4444" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#ffffff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Activities</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No activities found</Text>
          <Text style={styles.emptySubtext}>Add your first activity to get started</Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={renderActivity}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={handleRefresh}
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
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  list: {
    padding: 20,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityInfo: {
    flex: 1,
    marginRight: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  featuredBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
  },
  activityActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
});
