import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface OpeningHours {
  [day: string]: { open: string; close: string; closed?: boolean };
}

interface OpeningHoursDisplayProps {
  openingHours: OpeningHours;
  translations: {
    openToday: string;
    closed: string;
    dayNames: { [key: string]: string };
  };
}

export default function OpeningHoursDisplay({
  openingHours,
  translations,
}: OpeningHoursDisplayProps) {
  const getTodayHours = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const hours = openingHours[today];

    if (!hours || hours.closed) {
      return translations.closed;
    }
    return `${hours.open} - ${hours.close}`;
  };

  const todayHours = getTodayHours();

  return (
    <>
      <View style={styles.todayCard}>
        <Clock size={20} color={Colors.primary} />
        <View style={styles.hoursTextContainer}>
          <Text style={styles.hoursLabel}>{translations.openToday}</Text>
          <Text style={styles.hoursText}>{todayHours}</Text>
        </View>
      </View>

      <View style={styles.weeklyContainer}>
        {Object.entries(openingHours).map(([day, hours]) => (
          <View key={day} style={styles.dayRow}>
            <Text style={styles.dayText}>{translations.dayNames[day]}</Text>
            <Text style={styles.hoursValueText}>
              {hours.closed ? translations.closed : `${hours.open} - ${hours.close}`}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  hoursTextContainer: {
    flex: 1,
  },
  hoursLabel: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  hoursText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  weeklyContainer: {
    backgroundColor: Colors.lightGrey,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  hoursValueText: {
    fontSize: 15,
    color: Colors.textLight,
  },
});
