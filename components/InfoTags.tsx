import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface InfoTagsProps {
  ageMin: number;
  ageMax: number;
  isFree: boolean;
  priceMin?: number;
  priceMax?: number;
  isIndoor?: boolean;
  isOutdoor?: boolean;
  translations: {
    years: string;
    free: string;
    indoor: string;
    outdoor: string;
  };
}

export default function InfoTags({
  ageMin,
  ageMax,
  isFree,
  priceMin,
  priceMax,
  isIndoor,
  isOutdoor,
  translations,
}: InfoTagsProps) {
  return (
    <View style={styles.tagsRow}>
      <View style={styles.tag}>
        <Text style={styles.tagText}>
          {ageMin}-{ageMax} {translations.years}
        </Text>
      </View>
      <View style={styles.tag}>
        <Text style={styles.tagText}>
          {isFree ? translations.free : `€${priceMin}-€${priceMax}`}
        </Text>
      </View>
      {isIndoor && (
        <View style={styles.tag}>
          <Text style={styles.tagText}>{translations.indoor}</Text>
        </View>
      )}
      {isOutdoor && (
        <View style={styles.tag}>
          <Text style={styles.tagText}>{translations.outdoor}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: Colors.lightGrey,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
  },
});
