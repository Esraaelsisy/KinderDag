import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface LocationCardProps {
  address: string;
  city: string;
  province: string;
}

export default function LocationCard({ address, city, province }: LocationCardProps) {
  const openMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${address}`,
      android: `geo:0,0?q=${address}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
    });
    Linking.openURL(url);
  };

  return (
    <TouchableOpacity style={styles.locationCard} onPress={openMaps}>
      <View style={styles.locationInfo}>
        <MapPin size={20} color={Colors.primary} />
        <View style={styles.locationTextContainer}>
          <Text style={styles.locationText}>{address}</Text>
          <Text style={styles.locationSubtext}>
            {city}, {province}
          </Text>
        </View>
      </View>
      <Navigation size={20} color={Colors.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.lightGrey,
    padding: 16,
    borderRadius: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationSubtext: {
    fontSize: 14,
    color: Colors.textLight,
  },
});
