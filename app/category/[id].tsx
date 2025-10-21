import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { ArrowLeft, Filter, ArrowUpDown, X } from 'lucide-react-native';
import ActivityCard from '@/components/ActivityCard';

interface Activity {
  id: string;
  name_en: string;
  name_nl: string;
  city_id: string;
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
  cities: {
    name_en: string;
    name_nl: string;
  };
}

interface Category {
  id: string;
  name_en: string;
  name_nl: string;
  color: string;
}

type SortOption = 'featured' | 'rating' | 'price_low' | 'price_high' | 'name';

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { language } = useLanguage();

  const [category, setCategory] = useState<Category | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const [filters, setFilters] = useState({
    indoor: false,
    outdoor: false,
    free: false,
    ageRange: null as { min: number; max: number } | null,
  });

  const [sortBy, setSortBy] = useState<SortOption>('featured');

  useEffect(() => {
    loadCategoryAndActivities();
  }, [id]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [activities, filters, sortBy]);

  const loadCategoryAndActivities = async () => {
    setLoading(true);

    const { data: categoryData } = await supabase
      .from('activity_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (categoryData) {
      setCategory(categoryData);
    }

    const { data: activitiesData } = await supabase
      .from('activities')
      .select('*, cities(name_en, name_nl)')
      .contains('category_ids', [id])
      .eq('is_published', true);

    if (activitiesData) {
      setActivities(activitiesData as Activity[]);
    }

    setLoading(false);
  };

  const applyFiltersAndSort = () => {
    let filtered = [...activities];

    if (filters.indoor) {
      filtered = filtered.filter(a => a.is_indoor);
    }

    if (filters.outdoor) {
      filtered = filtered.filter(a => a.is_outdoor);
    }

    if (filters.free) {
      filtered = filtered.filter(a => a.is_free);
    }

    if (filters.ageRange) {
      filtered = filtered.filter(
        a => a.age_min <= filters.ageRange!.max && a.age_max >= filters.ageRange!.min
      );
    }

    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.average_rating - a.average_rating);
        break;
      case 'price_low':
        filtered.sort((a, b) => a.price_min - b.price_min);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price_max - a.price_max);
        break;
      case 'name':
        filtered.sort((a, b) =>
          (language === 'en' ? a.name_en : a.name_nl).localeCompare(
            language === 'en' ? b.name_en : b.name_nl
          )
        );
        break;
      default:
        break;
    }

    setFilteredActivities(filtered);
  };

  const clearFilters = () => {
    setFilters({
      indoor: false,
      outdoor: false,
      free: false,
      ageRange: null,
    });
  };

  const activeFilterCount =
    (filters.indoor ? 1 : 0) +
    (filters.outdoor ? 1 : 0) +
    (filters.free ? 1 : 0) +
    (filters.ageRange ? 1 : 0);

  const getCategoryEmoji = (nameEn: string) => {
    const emojiMap: Record<string, string> = {
      'spring fun': '🌸',
      'autumn fun': '🍂',
      'loyalty program': '⭐',
      'wednesday pass': '📅',
      'exclusively on kidzapp': '💎',
      'certified autism centers': '🤝',
      'afterschool activities': '🎒',
      'animal fun': '🐾',
      'art, music & dance': '🎨',
      'baby & toddler': '👶',
      'birthdays': '🎂',
      'courses, camps & workshops': '📚',
      'eat out': '🍽️',
      'explore the city': '🗺️',
      'free for people of determination': '💚',
      'fun & play': '🎮',
      'markets & fairs': '🎪',
      'outdoor & nature': '🌳',
      'parent zone': '👨‍👩‍👧',
      'schools & nurseries': '🏫',
      'shows & cinema': '🎬',
      'sports & active': '⚽',
      'theme parks': '🎢',
      'water fun': '💦',
      'fun at home': '🏠',
      'teens': '🎧',
    };
    return emojiMap[nameEn.toLowerCase()] || '🎯';
  };

  const renderActivity = ({ item }: { item: Activity }) => (
    <ActivityCard
      id={item.id}
      name={language === 'en' ? item.name_en : item.name_nl}
      city={language === 'en' ? item.cities.name_en : item.cities.name_nl}
      image={item.images[0]}
      rating={item.average_rating}
      reviewCount={item.total_reviews}
      priceMin={item.price_min}
      priceMax={item.price_max}
      isFree={item.is_free}
      ageMin={item.age_min}
      ageMax={item.age_max}
    />
  );

  if (loading || !category) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const categoryName = language === 'en' ? category.name_en : category.name_nl;
  const emoji = getCategoryEmoji(category.name_en);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[category.color, category.color + 'CC']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={Colors.white} size={24} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.title}>{categoryName}</Text>
          <Text style={styles.subtitle}>
            {filteredActivities.length} {language === 'en' ? 'activities' : 'activiteiten'}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, activeFilterCount > 0 && styles.controlButtonActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={18} color={activeFilterCount > 0 ? Colors.white : Colors.primary} />
          <Text style={[styles.controlText, activeFilterCount > 0 && styles.controlTextActive]}>
            {language === 'en' ? 'Filters' : 'Filters'}
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowSortModal(true)}
        >
          <ArrowUpDown size={18} color={Colors.primary} />
          <Text style={styles.controlText}>
            {language === 'en' ? 'Sort By' : 'Sorteer Op'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredActivities}
        renderItem={renderActivity}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'en' ? 'Filters' : 'Filters'}
              </Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.filterLabel}>
                {language === 'en' ? 'Location Type' : 'Locatietype'}
              </Text>

              <TouchableOpacity
                style={[styles.filterOption, filters.indoor && styles.filterOptionActive]}
                onPress={() => setFilters(f => ({ ...f, indoor: !f.indoor }))}
              >
                <Text style={[styles.filterOptionText, filters.indoor && styles.filterOptionTextActive]}>
                  🏠 {language === 'en' ? 'Indoor' : 'Binnen'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterOption, filters.outdoor && styles.filterOptionActive]}
                onPress={() => setFilters(f => ({ ...f, outdoor: !f.outdoor }))}
              >
                <Text style={[styles.filterOptionText, filters.outdoor && styles.filterOptionTextActive]}>
                  🌳 {language === 'en' ? 'Outdoor' : 'Buiten'}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.filterLabel, { marginTop: 20 }]}>
                {language === 'en' ? 'Price' : 'Prijs'}
              </Text>

              <TouchableOpacity
                style={[styles.filterOption, filters.free && styles.filterOptionActive]}
                onPress={() => setFilters(f => ({ ...f, free: !f.free }))}
              >
                <Text style={[styles.filterOptionText, filters.free && styles.filterOptionTextActive]}>
                  💰 {language === 'en' ? 'Free Only' : 'Alleen Gratis'}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.filterLabel, { marginTop: 20 }]}>
                {language === 'en' ? 'Age Range' : 'Leeftijdsbereik'}
              </Text>

              <TouchableOpacity
                style={[styles.filterOption, filters.ageRange?.min === 0 && filters.ageRange?.max === 3 && styles.filterOptionActive]}
                onPress={() => setFilters(f => ({ ...f, ageRange: { min: 0, max: 3 } }))}
              >
                <Text style={[styles.filterOptionText, filters.ageRange?.min === 0 && filters.ageRange?.max === 3 && styles.filterOptionTextActive]}>
                  👶 0-3 {language === 'en' ? 'years' : 'jaar'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterOption, filters.ageRange?.min === 4 && filters.ageRange?.max === 7 && styles.filterOptionActive]}
                onPress={() => setFilters(f => ({ ...f, ageRange: { min: 4, max: 7 } }))}
              >
                <Text style={[styles.filterOptionText, filters.ageRange?.min === 4 && filters.ageRange?.max === 7 && styles.filterOptionTextActive]}>
                  🧒 4-7 {language === 'en' ? 'years' : 'jaar'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterOption, filters.ageRange?.min === 8 && filters.ageRange?.max === 12 && styles.filterOptionActive]}
                onPress={() => setFilters(f => ({ ...f, ageRange: { min: 8, max: 12 } }))}
              >
                <Text style={[styles.filterOptionText, filters.ageRange?.min === 8 && filters.ageRange?.max === 12 && styles.filterOptionTextActive]}>
                  👦 8-12 {language === 'en' ? 'years' : 'jaar'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterOption, filters.ageRange?.min === 13 && filters.ageRange?.max === 18 && styles.filterOptionActive]}
                onPress={() => setFilters(f => ({ ...f, ageRange: { min: 13, max: 18 } }))}
              >
                <Text style={[styles.filterOptionText, filters.ageRange?.min === 13 && filters.ageRange?.max === 18 && styles.filterOptionTextActive]}>
                  🎧 13-18 {language === 'en' ? 'years' : 'jaar'}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>
                  {language === 'en' ? 'Clear All' : 'Alles Wissen'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>
                  {language === 'en' ? 'Apply Filters' : 'Filters Toepassen'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSortModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'en' ? 'Sort By' : 'Sorteer Op'}
              </Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <X size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TouchableOpacity
                style={[styles.sortOption, sortBy === 'featured' && styles.sortOptionActive]}
                onPress={() => {
                  setSortBy('featured');
                  setShowSortModal(false);
                }}
              >
                <Text style={[styles.sortOptionText, sortBy === 'featured' && styles.sortOptionTextActive]}>
                  ⭐ {language === 'en' ? 'Featured' : 'Uitgelicht'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortOption, sortBy === 'rating' && styles.sortOptionActive]}
                onPress={() => {
                  setSortBy('rating');
                  setShowSortModal(false);
                }}
              >
                <Text style={[styles.sortOptionText, sortBy === 'rating' && styles.sortOptionTextActive]}>
                  ⭐ {language === 'en' ? 'Highest Rated' : 'Hoogste Waardering'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortOption, sortBy === 'price_low' && styles.sortOptionActive]}
                onPress={() => {
                  setSortBy('price_low');
                  setShowSortModal(false);
                }}
              >
                <Text style={[styles.sortOptionText, sortBy === 'price_low' && styles.sortOptionTextActive]}>
                  💰 {language === 'en' ? 'Price: Low to High' : 'Prijs: Laag naar Hoog'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortOption, sortBy === 'price_high' && styles.sortOptionActive]}
                onPress={() => {
                  setSortBy('price_high');
                  setShowSortModal(false);
                }}
              >
                <Text style={[styles.sortOptionText, sortBy === 'price_high' && styles.sortOptionTextActive]}>
                  💎 {language === 'en' ? 'Price: High to Low' : 'Prijs: Hoog naar Laag'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortOption, sortBy === 'name' && styles.sortOptionActive]}
                onPress={() => {
                  setSortBy('name');
                  setShowSortModal(false);
                }}
              >
                <Text style={[styles.sortOptionText, sortBy === 'name' && styles.sortOptionTextActive]}>
                  🔤 {language === 'en' ? 'Name (A-Z)' : 'Naam (A-Z)'}
                </Text>
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
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.white,
    opacity: 0.9,
  },
  controls: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  controlButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  controlText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  controlTextActive: {
    color: Colors.white,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  modalBody: {
    padding: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  filterOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterOptionActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  filterOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  filterOptionTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  sortOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sortOptionActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  sortOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  sortOptionTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
});
