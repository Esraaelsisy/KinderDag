import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { ChevronLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

type SignUpStep = 'credentials' | 'kids' | 'language';

interface Kid {
  name: string;
  birthYear: string;
}

export default function SignUpScreen() {
  const [step, setStep] = useState<SignUpStep>('credentials');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [kids, setKids] = useState<Kid[]>([{ name: '', birthYear: '' }]);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'nl'>('en');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ fullName: '', email: '', password: '' });
  const { setLanguage } = useLanguage();
  const router = useRouter();

  const handleCredentialsNext = () => {
    const newErrors = { fullName: '', email: '', password: '' };
    let hasErrors = false;

    if (!fullName.trim()) {
      newErrors.fullName = 'Name is required';
      hasErrors = true;
    }

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
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      hasErrors = true;
    }

    setErrors(newErrors);

    if (!hasErrors) {
      setStep('kids');
    }
  };

  const handleKidsNext = () => {
    setStep('language');
  };

  const handleKidsSkip = () => {
    setKids([]);
    setStep('language');
  };

  const handleBack = () => {
    if (step === 'kids') {
      setStep('credentials');
    } else if (step === 'language') {
      setStep('kids');
    }
  };

  const handleSignUp = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setLoading(false);
        setErrors({ ...errors, email: error.message });
        setStep('credentials');
        return;
      }

      if (data.user) {
        await supabase
          .from('profiles')
          .update({ language: selectedLanguage })
          .eq('id', data.user.id);

        const validKids = kids.filter(kid => kid.birthYear && parseInt(kid.birthYear) > 1900);
        if (validKids.length > 0) {
          const kidsData = validKids.map(kid => ({
            profile_id: data.user.id,
            name: kid.name || null,
            birth_year: parseInt(kid.birthYear),
          }));
          await supabase.from('kids').insert(kidsData);
        }

        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', data.user.id);

        setLanguage(selectedLanguage);

        await new Promise(resolve => setTimeout(resolve, 500));

        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setLoading(false);
      setErrors({ ...errors, email: 'An error occurred during signup' });
      setStep('credentials');
    }
  };

  const addKid = () => {
    setKids([...kids, { name: '', birthYear: '' }]);
  };

  const updateKid = (index: number, field: 'name' | 'birthYear', value: string) => {
    const updated = [...kids];
    updated[index][field] = value;
    setKids(updated);
  };

  const removeKid = (index: number) => {
    if (kids.length > 1) {
      setKids(kids.filter((_, i) => i !== index));
    }
  };

  const renderCredentialsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join KinderDag to discover amazing activities</Text>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.fullName && styles.inputError]}
            placeholder="Full Name"
            placeholderTextColor={Colors.lightGrey}
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (errors.fullName) setErrors({ ...errors, fullName: '' });
            }}
          />
          {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="Email"
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
            placeholder="Password"
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

        <TouchableOpacity style={styles.button} onPress={handleCredentialsNext}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signin')}>
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderKidsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Tell us about your children</Text>
      <Text style={styles.subtitle}>This helps us recommend age-appropriate activities</Text>

      <ScrollView style={styles.scrollForm} showsVerticalScrollIndicator={false}>
        {kids.map((kid, index) => (
          <View key={index} style={styles.kidForm}>
            <TextInput
              style={styles.input}
              placeholder="Child's name (optional)"
              placeholderTextColor={Colors.lightGrey}
              value={kid.name}
              onChangeText={(value) => updateKid(index, 'name', value)}
            />
            <View style={styles.kidRow}>
              <TextInput
                style={[styles.input, styles.inputYear]}
                placeholder="Birth year"
                placeholderTextColor={Colors.lightGrey}
                value={kid.birthYear}
                onChangeText={(value) => updateKid(index, 'birthYear', value)}
                keyboardType="number-pad"
                maxLength={4}
              />
              {kids.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeKid(index)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addKid}>
          <Text style={styles.addButtonText}>+ Add Another Child</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleKidsNext}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleKidsSkip}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderLanguageStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Choose Your Language</Text>
      <Text style={styles.subtitle}>Select your preferred language</Text>

      <View style={styles.languageContainer}>
        <TouchableOpacity
          style={[styles.languageButton, selectedLanguage === 'en' && styles.languageButtonActive]}
          onPress={() => setSelectedLanguage('en')}
        >
          <Text style={[styles.languageText, selectedLanguage === 'en' && styles.languageTextActive]}>
            English
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.languageButton, selectedLanguage === 'nl' && styles.languageButtonActive]}
          onPress={() => setSelectedLanguage('nl')}
        >
          <Text style={[styles.languageText, selectedLanguage === 'nl' && styles.languageTextActive]}>
            Nederlands
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.primaryDark]}
      style={styles.container}
    >
      {step !== 'credentials' && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ChevronLeft size={24} color={Colors.white} />
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {step === 'credentials' && renderCredentialsStep()}
        {step === 'kids' && renderKidsStep()}
        {step === 'language' && renderLanguageStep()}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  keyboardView: {
    flex: 1,
  },
  stepContainer: {
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
    textAlign: 'center',
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
  scrollForm: {
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
    marginBottom: 12,
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
    backgroundColor: Colors.textDark,
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
  skipButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  skipButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  kidForm: {
    marginBottom: 16,
  },
  kidRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputYear: {
    flex: 1,
  },
  removeButton: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
  },
  removeButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  languageContainer: {
    width: '100%',
    maxWidth: 400,
  },
  languageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageButtonActive: {
    backgroundColor: Colors.white,
    borderColor: Colors.textDark,
  },
  languageText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
  },
  languageTextActive: {
    color: Colors.textDark,
  },
});
