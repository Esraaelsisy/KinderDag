import { Tabs } from 'expo-router';
import { Home, Grid3x3, User, Calendar, MapPinned } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/colors';
import type { LucideIcon } from 'lucide-react-native';

interface TabConfig {
  name: string;
  title: string;
  icon: LucideIcon;
  isCenter?: boolean;
  hidden?: boolean;
}

export default function TabLayout() {
  const { t } = useLanguage();

  const tabs: TabConfig[] = [
    { name: 'categories', title: 'Categories', icon: Grid3x3 },
    { name: 'events', title: t('nav.whatsOn'), icon: Calendar },
    { name: 'index', title: t('nav.home'), icon: Home, isCenter: true },
    { name: 'venues', title: t('nav.playSpots'), icon: MapPinned },
    { name: 'profile', title: t('profile.title'), icon: User },
    { name: 'search', title: '', icon: Home, hidden: true },
    { name: 'discover', title: '', icon: Home, hidden: true },
    { name: 'favorites', title: '', icon: Home, hidden: true },
    { name: 'activities', title: '', icon: Home, hidden: true },
    { name: 'chat', title: '', icon: Home, hidden: true },
  ];

  const renderTabIcon = (IconComponent: LucideIcon, isCenter: boolean = false) => {
    return ({ color, focused }: { color: string; focused: boolean }) => {
      if (isCenter) {
        return (
          <View style={styles.centerIconContainer}>
            <View style={[styles.centerIcon, !focused && styles.centerIconInactive]}>
              <IconComponent
                color={focused ? Colors.white : Colors.primary}
                size={28}
                strokeWidth={2.5}
              />
            </View>
          </View>
        );
      }

      return (
        <IconComponent
          color={focused ? Colors.white : color}
          size={24}
          strokeWidth={2.5}
          fill={focused ? Colors.primary : 'none'}
        />
      );
    };
  };

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
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: renderTabIcon(tab.icon, tab.isCenter),
            tabBarLabel: tab.isCenter ? () => null : undefined,
            href: tab.hidden ? null : undefined,
          }}
        />
      ))}
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
    shadowOffset: { width: 0, height: 4 },
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
});
