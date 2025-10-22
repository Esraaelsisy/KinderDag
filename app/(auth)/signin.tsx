import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const handleSignIn = async () => {
    const newErrors = { email: '', password: '' };
    let hasErrors = false;

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      hasErrors = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
      hasErrors = true;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      hasErrors = true;
    }

    setErrors(newErrors);

    if (hasErrors) {
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.primaryDark]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{t('app.name')}</Text>
          <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder={t('auth.email')}
                placeholderTextColor={Colors.lightGrey}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder={t('auth.password')}
                placeholderTextColor={Colors.lightGrey}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                secureTextEntry
              />
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? t('common.loading') : t('auth.signin')}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text style={styles.linkText}>{t('auth.signup')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 48,
    opacity: 0.9,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.white,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: Colors.white,
    fontSize: 14,
  },
  linkText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
