import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronRight } from 'lucide-react-native';

interface Category {
  id: string;
  name_en: string;
  name_nl: string;
  color: string;
  sort_order: number;
}

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const { language } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (data) {
      setCategories(data);
    }
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { borderLeftColor: item.color }]}
      onPress={() => {}}
    >
      <View style={styles.categoryContent}>
        <Text style={styles.categoryName}>
          {language === 'en' ? item.name_en : item.name_nl}
        </Text>
      </View>
      <ChevronRight size={20} color="#94a3b8" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.subtitle}>Browse activities by category</Text>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
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
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
});
