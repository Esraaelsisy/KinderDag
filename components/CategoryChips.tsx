import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/colors';

interface Category {
  id: string;
  name_en: string;
  name_nl: string;
  color: string;
  icon?: string;
}

interface CategoryChipsProps {
  data: Category[];
  onSelectCategory: (category: Category) => void;
  language: 'en' | 'nl';
}

export default function CategoryChips({
  data,
  onSelectCategory,
  language,
}: CategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {data.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.chip,
            { backgroundColor: category.color || Colors.primaryLight },
          ]}
          onPress={() => onSelectCategory(category)}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{category.icon || '🎨'}</Text>
          </View>
          <Text style={styles.chipText} numberOfLines={1}>
            {language === 'en' ? category.name_en : category.name_nl}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    minWidth: 120,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDark,
    flex: 1,
  },
});
