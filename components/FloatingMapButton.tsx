import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Map } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface FloatingMapButtonProps {
  onPress: () => void;
  language: 'en' | 'nl';
}

export default function FloatingMapButton({ onPress, language }: FloatingMapButtonProps) {
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={onPress}
      accessibilityLabel={language === 'en' ? 'View on map' : 'Bekijk op kaart'}
      accessibilityRole="button"
    >
      <Map size={20} color={Colors.white} />
      <Text style={styles.fabText}>
        {language === 'en' ? 'View on Map' : 'Bekijk op kaart'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: Platform.OS === 'ios' ? 80 : 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: Colors.teal,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  fabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
});
