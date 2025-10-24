import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  showProfileIcon?: boolean;
  gradient?: boolean;
  children?: React.ReactNode;
}

export default function Header({ title, showProfileIcon = true, gradient = true, children }: HeaderProps) {
  const router = useRouter();

  const content = (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {showProfileIcon && (
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <User size={24} color={Colors.secondary} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );

  if (gradient) {
    return (
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.gradient}>
        {content}
      </LinearGradient>
    );
  }

  return <View style={styles.solidBackground}>{content}</View>;
}

const styles = StyleSheet.create({
  gradient: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  solidBackground: {
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.primary,
  },
  container: {
    paddingHorizontal: 20,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
});
