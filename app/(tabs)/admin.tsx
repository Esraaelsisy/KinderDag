import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Plus, List } from 'lucide-react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';

export default function AdminPanel() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.subtitle}>Manage activities and content</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/admin/add-activity')}
        >
          <View style={styles.iconContainer}>
            <Plus color={colors.primary} size={32} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Add New Activity</Text>
            <Text style={styles.actionDescription}>
              Manually add a new activity or venue to the database
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/admin/manage-activities')}
        >
          <View style={styles.iconContainer}>
            <List color={colors.primary} size={32} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manage Activities</Text>
            <Text style={styles.actionDescription}>
              View, edit, or delete existing activities
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});
