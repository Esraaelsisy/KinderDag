import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, MapPin } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface SegmentedControlProps {
  selectedSegment: 'events' | 'places';
  onSegmentChange: (segment: 'events' | 'places') => void;
  language: 'en' | 'nl';
}

export default function SegmentedControl({
  selectedSegment,
  onSegmentChange,
  language,
}: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.segment, selectedSegment === 'events' && styles.segmentActive]}
        onPress={() => onSegmentChange('events')}
      >
        <Calendar
          size={18}
          color={selectedSegment === 'events' ? Colors.white : Colors.textLight}
        />
        <Text
          style={[styles.segmentText, selectedSegment === 'events' && styles.segmentTextActive]}
        >
          {language === 'en' ? 'Events' : 'Agenda'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.segment, selectedSegment === 'places' && styles.segmentActive]}
        onPress={() => onSegmentChange('places')}
      >
        <MapPin
          size={18}
          color={selectedSegment === 'places' ? Colors.white : Colors.textLight}
        />
        <Text
          style={[styles.segmentText, selectedSegment === 'places' && styles.segmentTextActive]}
        >
          {language === 'en' ? 'Places' : 'Speelplekken'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  segmentActive: {
    backgroundColor: Colors.teal,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textLight,
  },
  segmentTextActive: {
    color: Colors.white,
  },
});
