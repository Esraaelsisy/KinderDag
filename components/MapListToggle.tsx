import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Map, List } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface MapListToggleProps {
  view: 'map' | 'list';
  onToggle: (view: 'map' | 'list') => void;
}

export default function MapListToggle({ view, onToggle }: MapListToggleProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, view === 'map' && styles.buttonActive]}
        onPress={() => onToggle('map')}
      >
        <Map size={18} color={view === 'map' ? Colors.white : Colors.textLight} />
        <Text style={[styles.buttonText, view === 'map' && styles.buttonTextActive]}>
          Map
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, view === 'list' && styles.buttonActive]}
        onPress={() => onToggle('list')}
      >
        <List size={18} color={view === 'list' ? Colors.white : Colors.textLight} />
        <Text style={[styles.buttonText, view === 'list' && styles.buttonTextActive]}>
          List
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 6,
  },
  buttonActive: {
    backgroundColor: Colors.secondary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
  },
  buttonTextActive: {
    color: Colors.white,
  },
});
