import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onPressCTA?: () => void;
}

export default function SectionHeader({
  title,
  subtitle,
  ctaLabel,
  onPressCTA,
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {ctaLabel && onPressCTA && (
        <TouchableOpacity style={styles.ctaButton} onPress={onPressCTA}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
          <ChevronRight size={16} color={Colors.teal} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.teal,
  },
});
