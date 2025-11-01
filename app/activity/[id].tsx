import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function ActivityRedirect() {
  const { id, type } = useLocalSearchParams();
  const activityType = (type as string) || 'venue';

  if (!id) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Activity not found</Text>
      </View>
    );
  }

  return <Redirect href={activityType === 'event' ? `/event/${id}` : `/venue/${id}`} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  text: {
    fontSize: 16,
    color: Colors.textLight,
  },
});
