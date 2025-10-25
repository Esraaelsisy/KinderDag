import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

export interface EventsFilters {
  price: 'free' | 'under10' | 'under20' | 'any';
  ageGroups: string[];
  distance: '5' | '10' | '25' | 'any';
  timeOfDay: string[];
}

interface EventsFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: EventsFilters;
  onFiltersChange: (filters: EventsFilters) => void;
  language: 'en' | 'nl';
}

export default function EventsFilterModal({
  visible,
  onClose,
  filters,
  onFiltersChange,
  language,
}: EventsFilterModalProps) {
  const toggleAgeGroup = (age: string) => {
    const newAgeGroups = filters.ageGroups.includes(age)
      ? filters.ageGroups.filter(a => a !== age)
      : [...filters.ageGroups, age];
    onFiltersChange({ ...filters, ageGroups: newAgeGroups });
  };

  const toggleTimeOfDay = (time: string) => {
    const newTimeOfDay = filters.timeOfDay.includes(time)
      ? filters.timeOfDay.filter(t => t !== time)
      : [...filters.timeOfDay, time];
    onFiltersChange({ ...filters, timeOfDay: newTimeOfDay });
  };

  const clearFilters = () => {
    onFiltersChange({
      price: 'any',
      ageGroups: [],
      distance: 'any',
      timeOfDay: [],
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{language === 'en' ? 'Filters' : 'Filters'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{language === 'en' ? 'PRICE' : 'PRIJS'}</Text>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => onFiltersChange({ ...filters, price: 'free' })}
              >
                <View style={[styles.radio, filters.price === 'free' && styles.radioActive]} />
                <Text style={styles.optionText}>{language === 'en' ? 'Free' : 'Gratis'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => onFiltersChange({ ...filters, price: 'under10' })}
              >
                <View style={[styles.radio, filters.price === 'under10' && styles.radioActive]} />
                <Text style={styles.optionText}>{language === 'en' ? 'Under €10' : 'Onder €10'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => onFiltersChange({ ...filters, price: 'under20' })}
              >
                <View style={[styles.radio, filters.price === 'under20' && styles.radioActive]} />
                <Text style={styles.optionText}>{language === 'en' ? 'Under €20' : 'Onder €20'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => onFiltersChange({ ...filters, price: 'any' })}
              >
                <View style={[styles.radio, filters.price === 'any' && styles.radioActive]} />
                <Text style={styles.optionText}>{language === 'en' ? 'Any price' : 'Elke prijs'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{language === 'en' ? 'AGE GROUPS' : 'LEEFTIJDSGROEPEN'}</Text>
              <TouchableOpacity style={styles.checkboxOption} onPress={() => toggleAgeGroup('0-3')}>
                <View style={[styles.checkbox, filters.ageGroups.includes('0-3') && styles.checkboxActive]} />
                <Text style={styles.optionText}>0-3 {language === 'en' ? 'years' : 'jaar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.checkboxOption} onPress={() => toggleAgeGroup('4-7')}>
                <View style={[styles.checkbox, filters.ageGroups.includes('4-7') && styles.checkboxActive]} />
                <Text style={styles.optionText}>4-7 {language === 'en' ? 'years' : 'jaar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.checkboxOption} onPress={() => toggleAgeGroup('8-12')}>
                <View style={[styles.checkbox, filters.ageGroups.includes('8-12') && styles.checkboxActive]} />
                <Text style={styles.optionText}>8-12 {language === 'en' ? 'years' : 'jaar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.checkboxOption} onPress={() => toggleAgeGroup('13+')}>
                <View style={[styles.checkbox, filters.ageGroups.includes('13+') && styles.checkboxActive]} />
                <Text style={styles.optionText}>13+ {language === 'en' ? 'years' : 'jaar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.checkboxOption} onPress={() => toggleAgeGroup('all')}>
                <View style={[styles.checkbox, filters.ageGroups.includes('all') && styles.checkboxActive]} />
                <Text style={styles.optionText}>{language === 'en' ? 'All ages' : 'Alle leeftijden'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{language === 'en' ? 'DISTANCE' : 'AFSTAND'}</Text>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => onFiltersChange({ ...filters, distance: '5' })}
              >
                <View style={[styles.radio, filters.distance === '5' && styles.radioActive]} />
                <Text style={styles.optionText}>{language === 'en' ? 'Within 5km' : 'Binnen 5km'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => onFiltersChange({ ...filters, distance: '10' })}
              >
                <View style={[styles.radio, filters.distance === '10' && styles.radioActive]} />
                <Text style={styles.optionText}>{language === 'en' ? 'Within 10km' : 'Binnen 10km'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => onFiltersChange({ ...filters, distance: '25' })}
              >
                <View style={[styles.radio, filters.distance === '25' && styles.radioActive]} />
                <Text style={styles.optionText}>{language === 'en' ? 'Within 25km' : 'Binnen 25km'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => onFiltersChange({ ...filters, distance: 'any' })}
              >
                <View style={[styles.radio, filters.distance === 'any' && styles.radioActive]} />
                <Text style={styles.optionText}>{language === 'en' ? 'Any distance' : 'Elke afstand'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{language === 'en' ? 'TIME OF DAY' : 'TIJDSTIP'}</Text>
              <TouchableOpacity style={styles.checkboxOption} onPress={() => toggleTimeOfDay('morning')}>
                <View style={[styles.checkbox, filters.timeOfDay.includes('morning') && styles.checkboxActive]} />
                <Text style={styles.optionText}>{language === 'en' ? 'Morning (before 12pm)' : 'Ochtend (voor 12u)'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.checkboxOption} onPress={() => toggleTimeOfDay('afternoon')}>
                <View style={[styles.checkbox, filters.timeOfDay.includes('afternoon') && styles.checkboxActive]} />
                <Text style={styles.optionText}>{language === 'en' ? 'Afternoon (12-5pm)' : 'Middag (12-17u)'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.checkboxOption} onPress={() => toggleTimeOfDay('evening')}>
                <View style={[styles.checkbox, filters.timeOfDay.includes('evening') && styles.checkboxActive]} />
                <Text style={styles.optionText}>{language === 'en' ? 'Evening (after 5pm)' : 'Avond (na 17u)'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>{language === 'en' ? 'Clear All' : 'Wis Alles'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={onClose}>
              <Text style={styles.applyButtonText}>{language === 'en' ? 'Apply' : 'Toepassen'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textLight,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: 12,
  },
  radioActive: {
    borderWidth: 7,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
  },
  optionText: {
    fontSize: 16,
    color: Colors.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
