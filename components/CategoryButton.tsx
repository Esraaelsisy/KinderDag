import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors } from '@/constants/colors';

interface CategoryButtonProps {
  nameEn: string;
  nameNl: string;
  color: string;
  emoji?: string;
  isActive?: boolean;
  onPress: () => void;
}

export default function CategoryButton({
  nameEn,
  nameNl,
  color,
  emoji,
  isActive = false,
  onPress,
}: CategoryButtonProps) {
  const { language } = useLanguage();
  const name = language === 'en' ? nameEn : nameNl;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { borderColor: color },
        isActive && { backgroundColor: color },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {emoji && <Text style={styles.emoji}>{emoji}</Text>}
        <Text style={[styles.text, { color: isActive ? '#ffffff' : color }]}>{name}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 12,
    backgroundColor: Colors.white,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  emoji: {
    fontSize: 16,
  },
});
