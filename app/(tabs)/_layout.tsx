import { Tabs } from 'expo-router';
import { Home, Grid3x3, User, Calendar, MapPinned } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/colors';

export default function TabLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.secondary,
          tabBarStyle: {
            backgroundColor: Colors.white,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 20 : 8,
            height: Platform.OS === 'ios' ? 85 : 70,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <Grid3x3
                color={focused ? Colors.white : color}
                size={size}
                strokeWidth={2.5}
                fill={focused ? Colors.white : 'none'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: t('nav.whatsOn'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <Calendar
                color={focused ? Colors.white : color}
                size={size}
                strokeWidth={2.5}
                fill={focused ? Colors.white : 'none'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.centerIconContainer}>
              <View style={[styles.centerIcon, !focused && styles.centerIconInactive]}>
                <Home
                  color={focused ? Colors.white : Colors.primary}
                  size={28}
                  strokeWidth={2.5}
                />
              </View>
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="venues"
        options={{
          title: t('nav.playSpots'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <MapPinned
                color={focused ? Colors.white : color}
                size={size}
                strokeWidth={2.5}
                fill={focused ? Colors.white : 'none'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <User
                color={focused ? Colors.white : color}
                size={size}
                strokeWidth={2.5}
                fill={focused ? Colors.white : 'none'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
        }}
      />
      </Tabs>
  );
}

const styles = StyleSheet.create({
  centerIconContainer: {
    position: 'absolute',
    top: -30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: Colors.white,
  },
  centerIconInactive: {
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  activeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
