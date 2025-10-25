import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface FilterButtonProps {
  onPress: () => void;
  filterCount?: number;
}

export default function FilterButton({ onPress, filterCount = 0 }: FilterButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <SlidersHorizontal size={20} color={filterCount > 0 ? Colors.primary : Colors.textDark} />
      {filterCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{filterCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    backgroundColor: Colors.white,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
