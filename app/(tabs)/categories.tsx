import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';

interface Category {
  id: string;
  name_en: string;
  name_nl: string;
  color: string;
  sort_order: number;
  icon?: string;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const { language } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('activity_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (data) {
      setCategories(data);
    }
  };

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

  const getCategoryGradient = (index: number): [string, string] => {
    const gradients: Array<[string, string]> = [
      ['#06b6d4', '#0891b2'],
      ['#10b981', '#059669'],
      ['#f59e0b', '#d97706'],
      ['#ef4444', '#dc2626'],
      ['#8b5cf6', '#7c3aed'],
      ['#ec4899', '#db2777'],
      ['#14b8a6', '#0d9488'],
      ['#f97316', '#ea580c'],
    ];
    return gradients[index % gradients.length];
  };

  const renderCategory = ({ item, index }: { item: Category; index: number }) => {
    const gradient = getCategoryGradient(index);
    const emoji = getCategoryEmoji(item.name_en);

    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => {}}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientCard}
        >
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.categoryName}>
            {language === 'en' ? item.name_en : item.name_nl}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#10B981', '#059669']} style={styles.header}>
        <Text style={styles.title}>
          {language === 'en' ? 'Categories' : 'Categorieën'}
        </Text>
        <Text style={styles.subtitle}>
          {language === 'en'
            ? 'Discover activities by category'
            : 'Ontdek activiteiten per categorie'}
        </Text>
      </LinearGradient>

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
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
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#ffffff',
    opacity: 0.9,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryCard: {
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  gradientCard: {
    padding: 24,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  emoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 23,
  },
});
