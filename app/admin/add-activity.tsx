import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';

interface Category {
  id: string;
  name_en: string;
  name_nl: string;
}

export default function AddActivity() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description_en: '',
    description_nl: '',
    location_lat: '',
    location_lng: '',
    address: '',
    city: '',
    province: '',
    age_min: '0',
    age_max: '12',
    price_min: '0',
    price_max: '0',
    is_free: false,
    is_indoor: false,
    is_outdoor: false,
    weather_dependent: false,
    phone: '',
    email: '',
    website: '',
    booking_url: '',
    is_featured: false,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const { data, error } = await supabase
      .from('activity_categories')
      .select('*')
      .order('sort_order');

    if (data) {
      setCategories(data);
    }
  }

  function updateField(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCategory(categoryId: string) {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Activity name is required');
      return;
    }

    if (!formData.description_en.trim() || !formData.description_nl.trim()) {
      Alert.alert('Error', 'Descriptions in both languages are required');
      return;
    }

    if (!formData.city.trim() || !formData.address.trim()) {
      Alert.alert('Error', 'City and address are required');
      return;
    }

    if (selectedCategories.length === 0) {
      Alert.alert('Error', 'Please select at least one category');
      return;
    }

    setLoading(true);

    try {
      const { data: activity, error: activityError } = await supabase
        .from('activities')
        .insert({
          name: formData.name,
          description_en: formData.description_en,
          description_nl: formData.description_nl,
          location_lat: parseFloat(formData.location_lat) || 0,
          location_lng: parseFloat(formData.location_lng) || 0,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          age_min: parseInt(formData.age_min) || 0,
          age_max: parseInt(formData.age_max) || 12,
          price_min: parseFloat(formData.price_min) || 0,
          price_max: parseFloat(formData.price_max) || 0,
          is_free: formData.is_free,
          is_indoor: formData.is_indoor,
          is_outdoor: formData.is_outdoor,
          weather_dependent: formData.weather_dependent,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          booking_url: formData.booking_url,
          is_featured: formData.is_featured,
        })
        .select()
        .single();

      if (activityError) throw activityError;

      const categoryLinks = selectedCategories.map((categoryId) => ({
        activity_id: activity.id,
        category_id: categoryId,
      }));

      const { error: linkError } = await supabase
        .from('activity_category_links')
        .insert(categoryLinks);

      if (linkError) throw linkError;

      Alert.alert('Success', 'Activity added successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save activity');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#ffffff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Activity</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={styles.saveButton}
        >
          <Save color="#ffffff" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Text style={styles.label}>Activity Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => updateField('name', text)}
            placeholder="e.g., Amsterdam Zoo"
          />

          <Text style={styles.label}>Description (English) *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description_en}
            onChangeText={(text) => updateField('description_en', text)}
            placeholder="Enter English description"
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Description (Dutch) *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description_nl}
            onChangeText={(text) => updateField('description_nl', text)}
            placeholder="Enter Dutch description"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(text) => updateField('address', text)}
            placeholder="e.g., Plantage Kerklaan 38"
          />

          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            value={formData.city}
            onChangeText={(text) => updateField('city', text)}
            placeholder="e.g., Amsterdam"
          />

          <Text style={styles.label}>Province</Text>
          <TextInput
            style={styles.input}
            value={formData.province}
            onChangeText={(text) => updateField('province', text)}
            placeholder="e.g., Noord-Holland"
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                value={formData.location_lat}
                onChangeText={(text) => updateField('location_lat', text)}
                placeholder="52.3676"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                value={formData.location_lng}
                onChangeText={(text) => updateField('location_lng', text)}
                placeholder="4.9041"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Age & Pricing</Text>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Min Age</Text>
              <TextInput
                style={styles.input}
                value={formData.age_min}
                onChangeText={(text) => updateField('age_min', text)}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Max Age</Text>
              <TextInput
                style={styles.input}
                value={formData.age_max}
                onChangeText={(text) => updateField('age_max', text)}
                placeholder="12"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Free Activity</Text>
            <Switch
              value={formData.is_free}
              onValueChange={(value) => updateField('is_free', value)}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
            />
          </View>

          {!formData.is_free && (
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Min Price (€)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price_min}
                  onChangeText={(text) => updateField('price_min', text)}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Max Price (€)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price_max}
                  onChangeText={(text) => updateField('price_max', text)}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Type</Text>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Indoor</Text>
            <Switch
              value={formData.is_indoor}
              onValueChange={(value) => updateField('is_indoor', value)}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Outdoor</Text>
            <Switch
              value={formData.is_outdoor}
              onValueChange={(value) => updateField('is_outdoor', value)}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Weather Dependent</Text>
            <Switch
              value={formData.weather_dependent}
              onValueChange={(value) => updateField('weather_dependent', value)}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Featured Activity</Text>
            <Switch
              value={formData.is_featured}
              onValueChange={(value) => updateField('is_featured', value)}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => updateField('phone', text)}
            placeholder="+31 20 123 4567"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            placeholder="info@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Website</Text>
          <TextInput
            style={styles.input}
            value={formData.website}
            onChangeText={(text) => updateField('website', text)}
            placeholder="https://example.com"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Booking URL</Text>
          <TextInput
            style={styles.input}
            value={formData.booking_url}
            onChangeText={(text) => updateField('booking_url', text)}
            placeholder="https://example.com/book"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories *</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategories.includes(category.id) && styles.categoryChipSelected,
                ]}
                onPress={() => toggleCategory(category.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategories.includes(category.id) &&
                      styles.categoryChipTextSelected,
                  ]}
                >
                  {category.name_en}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Saving...' : 'Save Activity'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
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
  saveButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  bottomSpacing: {
    height: 40,
  },
});
