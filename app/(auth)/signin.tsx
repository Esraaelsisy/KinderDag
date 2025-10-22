import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Apple } from 'lucide-react-native';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', auth: '' });
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const handleSignIn = async () => {
    const newErrors = { email: '', password: '', auth: '' };
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
      setErrors({ email: '', password: '', auth: 'Invalid email or password. Please try again.' });
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setErrors({ email: '', password: '', auth: 'Failed to sign in with Google. Please try again.' });
      setOauthLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setOauthLoading(true);
    const { error } = await signInWithApple();
    if (error) {
      setErrors({ email: '', password: '', auth: 'Failed to sign in with Apple. Please try again.' });
      setOauthLoading(false);
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
            {errors.auth ? (
              <View style={styles.authErrorContainer}>
                <Text style={styles.authErrorText}>{errors.auth}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder={t('auth.email')}
                placeholderTextColor={Colors.lightGrey}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email || errors.auth) setErrors({ ...errors, email: '', auth: '' });
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
                  if (errors.password || errors.auth) setErrors({ ...errors, password: '', auth: '' });
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

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={[styles.googleButton, oauthLoading && styles.buttonDisabled]}
                onPress={handleGoogleSignIn}
                disabled={oauthLoading}
              >
                <View style={styles.googleIconContainer}>
                  <View style={styles.googleIcon}>
                    <View style={styles.googleIconBlue} />
                    <View style={styles.googleIconRed} />
                    <View style={styles.googleIconYellow} />
                    <View style={styles.googleIconGreen} />
                  </View>
                </View>
                <Text style={styles.googleButtonText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.appleButton, oauthLoading && styles.buttonDisabled]}
                onPress={handleAppleSignIn}
                disabled={oauthLoading}
              >
                <Apple size={18} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.appleButtonText}>Apple</Text>
              </TouchableOpacity>
            </View>

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
  authErrorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  authErrorText: {
    color: Colors.white,
    fontSize: 14,
    textAlign: 'center',
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
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: Colors.white,
    fontSize: 14,
    marginHorizontal: 12,
    opacity: 0.8,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  googleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  googleButtonText: {
    color: '#1F1F1F',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.25,
  },
  appleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.25,
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 18,
    height: 18,
    position: 'relative',
  },
  googleIconBlue: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 9,
    height: 9,
    backgroundColor: '#4285F4',
    borderTopRightRadius: 9,
  },
  googleIconRed: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 9,
    height: 9,
    backgroundColor: '#EA4335',
    borderTopLeftRadius: 9,
  },
  googleIconYellow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 9,
    height: 9,
    backgroundColor: '#FBBC04',
    borderBottomLeftRadius: 9,
  },
  googleIconGreen: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    backgroundColor: '#34A853',
    borderBottomRightRadius: 9,
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
