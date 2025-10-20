import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';

interface CategoryButtonProps {
  nameEn: string;
  nameNl: string;
  color: string;
  isActive?: boolean;
  onPress: () => void;
}

export default function CategoryButton({
  nameEn,
  nameNl,
  color,
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
      <Text style={[styles.text, { color: isActive ? '#ffffff' : color }]}>{name}</Text>
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
    backgroundColor: '#ffffff',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
