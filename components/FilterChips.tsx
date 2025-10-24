import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '@/constants/colors';

interface FilterChip {
  id: string;
  label: string;
  value: string | boolean;
}

interface FilterChipsProps {
  chips: FilterChip[];
  selectedChips: string[];
  onChipPress: (chipId: string) => void;
  style?: any;
}

export default function FilterChips({ chips, selectedChips, onChipPress, style }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
    >
      {chips.map((chip) => {
        const isSelected = selectedChips.includes(chip.id);
        return (
          <TouchableOpacity
            key={chip.id}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onChipPress(chip.id)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textDark,
  },
  chipTextSelected: {
    color: Colors.white,
  },
});
