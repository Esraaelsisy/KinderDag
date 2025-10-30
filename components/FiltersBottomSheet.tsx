import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

export interface SearchFilters {
  dateFilter: string;
  ageMin?: number;
  ageMax?: number;
  priceFilter: string;
  isIndoor?: boolean;
  isOutdoor?: boolean;
  categoryIds: string[];
}

interface FiltersBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  language: 'en' | 'nl';
}

export default function FiltersBottomSheet({
  visible,
  onClose,
  filters,
  onApply,
  language,
}: FiltersBottomSheetProps) {
  const [localFilters, setLocalFilters] = React.useState<SearchFilters>(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleClear = () => {
    const clearedFilters: SearchFilters = {
      dateFilter: '',
      priceFilter: '',
      categoryIds: [],
    };
    setLocalFilters(clearedFilters);
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const dateOptions = [
    { value: 'today', labelEn: 'Today', labelNl: 'Vandaag' },
    { value: 'tomorrow', labelEn: 'Tomorrow', labelNl: 'Morgen' },
    { value: 'weekend', labelEn: 'Weekend', labelNl: 'Weekend' },
  ];

  const priceOptions = [
    { value: 'free', labelEn: 'Free', labelNl: 'Gratis' },
    { value: 'under10', labelEn: '< €10', labelNl: '< €10' },
    { value: 'any', labelEn: 'Any', labelNl: 'Alle' },
  ];

  const ageOptions = [
    { min: 0, max: 3, labelEn: '0-3y', labelNl: '0-3j' },
    { min: 4, max: 7, labelEn: '4-7y', labelNl: '4-7j' },
    { min: 8, max: 12, labelEn: '8-12y', labelNl: '8-12j' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {language === 'en' ? 'Filters' : 'Filters'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={24} color={Colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Date' : 'Datum'}
              </Text>
              <View style={styles.chipGroup}>
                {dateOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.chip,
                      localFilters.dateFilter === option.value && styles.chipActive,
                    ]}
                    onPress={() =>
                      setLocalFilters({
                        ...localFilters,
                        dateFilter: localFilters.dateFilter === option.value ? '' : option.value,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        localFilters.dateFilter === option.value && styles.chipTextActive,
                      ]}
                    >
                      {language === 'en' ? option.labelEn : option.labelNl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Age Range' : 'Leeftijd'}
              </Text>
              <View style={styles.chipGroup}>
                {ageOptions.map((option) => {
                  const isSelected = localFilters.ageMin === option.min && localFilters.ageMax === option.max;
                  return (
                    <TouchableOpacity
                      key={`${option.min}-${option.max}`}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() =>
                        setLocalFilters({
                          ...localFilters,
                          ageMin: isSelected ? undefined : option.min,
                          ageMax: isSelected ? undefined : option.max,
                        })
                      }
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {language === 'en' ? option.labelEn : option.labelNl}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Price' : 'Prijs'}
              </Text>
              <View style={styles.chipGroup}>
                {priceOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.chip,
                      localFilters.priceFilter === option.value && styles.chipActive,
                    ]}
                    onPress={() =>
                      setLocalFilters({
                        ...localFilters,
                        priceFilter: localFilters.priceFilter === option.value ? '' : option.value,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        localFilters.priceFilter === option.value && styles.chipTextActive,
                      ]}
                    >
                      {language === 'en' ? option.labelEn : option.labelNl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Location Type' : 'Locatie Type'}
              </Text>
              <View style={styles.chipGroup}>
                <TouchableOpacity
                  style={[styles.chip, localFilters.isIndoor && styles.chipActive]}
                  onPress={() =>
                    setLocalFilters({
                      ...localFilters,
                      isIndoor: !localFilters.isIndoor,
                    })
                  }
                >
                  <Text style={[styles.chipText, localFilters.isIndoor && styles.chipTextActive]}>
                    {language === 'en' ? 'Indoor' : 'Binnen'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, localFilters.isOutdoor && styles.chipActive]}
                  onPress={() =>
                    setLocalFilters({
                      ...localFilters,
                      isOutdoor: !localFilters.isOutdoor,
                    })
                  }
                >
                  <Text style={[styles.chipText, localFilters.isOutdoor && styles.chipTextActive]}>
                    {language === 'en' ? 'Outdoor' : 'Buiten'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>
                {language === 'en' ? 'Clear' : 'Wissen'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>
                {language === 'en' ? 'Apply' : 'Toepassen'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const React = require('react');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 12,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textDark,
  },
  chipTextActive: {
    color: Colors.white,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.inputBackground,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.teal,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
