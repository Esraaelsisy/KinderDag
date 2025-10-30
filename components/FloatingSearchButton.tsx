import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Search } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useRouter } from 'expo-router';

export default function FloatingSearchButton() {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => router.push('/(tabs)/search')}
      accessibilityLabel="Open search"
      accessibilityRole="button"
    >
      <Search size={24} color={Colors.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: Platform.OS === 'ios' ? 80 : 70,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
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
});
