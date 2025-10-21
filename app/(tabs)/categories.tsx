import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

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

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => {}}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <Text style={[styles.categoryName, { color: item.color || '#0ea5e9' }]}>
          {language === 'en' ? item.name_en : item.name_nl}
        </Text>
        {item.icon && (
          <Text style={styles.emoji}>{item.icon}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
      </View>

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
    paddingBottom: 24,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  list: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryCard: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  emoji: {
    fontSize: 48,
    alignSelf: 'flex-end',
  },
});
