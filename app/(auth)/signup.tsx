import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { ChevronLeft, Calendar as CalendarIcon, Edit3, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

type SignUpStep = 'credentials' | 'kids' | 'language';

interface Kid {
  name: string;
  birthDate: string;
}

export default function SignUpScreen() {
  const [step, setStep] = useState<SignUpStep>('credentials');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [kids, setKids] = useState<Kid[]>([{ name: '', birthDate: '' }]);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'nl'>('en');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ fullName: '', email: '', password: '' });
  const [showDatePicker, setShowDatePicker] = useState<number | null>(null);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
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

        const validKids = kids.filter(kid => kid.birthDate && kid.birthDate.trim() !== '');
        if (validKids.length > 0) {
          const kidsData = validKids.map(kid => ({
            profile_id: data.user.id,
            name: kid.name || null,
            birth_date: kid.birthDate,
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
    setKids([...kids, { name: '', birthDate: '' }]);
  };

  const updateKid = (index: number, field: 'name' | 'birthDate', value: string) => {
    const updated = [...kids];
    updated[index][field] = value;
    setKids(updated);
  };

  const removeKid = (index: number) => {
    if (kids.length > 1) {
      setKids(kids.filter((_, i) => i !== index));
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getYearsList = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 18; year--) {
      years.push(year);
    }
    return years;
  };

  const getMonthsList = () => {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  };

  const selectYear = (year: number) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(year);

    const today = new Date();
    if (newDate > today) {
      newDate.setMonth(today.getMonth());
    }

    setCurrentMonth(newDate);
    setShowYearPicker(false);
  };

  const selectMonth = (monthIndex: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(monthIndex);

    const today = new Date();
    if (newDate > today) {
      return;
    }

    setCurrentMonth(newDate);
    setShowMonthPicker(false);
  };

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const changeMonth = (offset: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setCurrentMonth(newMonth);
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const openDatePicker = (index: number) => {
    const kid = kids[index];
    if (kid.birthDate) {
      const date = new Date(kid.birthDate);
      setTempSelectedDate(date);
      setCurrentMonth(date);
    } else {
      const today = new Date();
      setTempSelectedDate(today);
      setCurrentMonth(today);
    }
    setShowDatePicker(index);
  };

  const confirmDateSelection = (index: number) => {
    if (tempSelectedDate) {
      const dateString = tempSelectedDate.toISOString().split('T')[0];
      updateKid(index, 'birthDate', dateString);
    }
    setShowDatePicker(null);
    setTempSelectedDate(null);
  };

  const renderCredentialsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.subtitle}>Let's create your account</Text>

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
      <Text style={styles.title}>Your Children</Text>
      <Text style={styles.subtitle}>Help us personalize activities for your kids</Text>

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
              <TouchableOpacity
                style={[styles.datePickerButton, styles.inputBirthDate]}
                onPress={() => openDatePicker(index)}
              >
                <Text style={[styles.datePickerText, !kid.birthDate && styles.datePickerPlaceholder]}>
                  {kid.birthDate ? formatDateDisplay(kid.birthDate) : 'Select birth date'}
                </Text>
                <CalendarIcon size={20} color={kid.birthDate ? Colors.textDark : Colors.lightGrey} />
              </TouchableOpacity>
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
      <Text style={styles.title}>Language</Text>
      <Text style={styles.subtitle}>Choose your preferred language</Text>

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

      <Modal
        visible={showDatePicker !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDatePicker(null)}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Select birth date</Text>
            </View>

            <View style={styles.datePickerSelectedContainer}>
              <Text style={styles.datePickerSelectedDate}>
                {tempSelectedDate
                  ? tempSelectedDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'No date selected'}
              </Text>
              <Edit3 size={20} color={Colors.textDark} />
            </View>

            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  style={styles.monthYearSelector}
                  onPress={() => setShowMonthPicker(true)}
                >
                  <Text style={styles.monthYearText}>
                    {currentMonth.toLocaleDateString('en-US', { month: 'long' })}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.monthYearSelector}
                  onPress={() => setShowYearPicker(true)}
                >
                  <Text style={styles.monthYearText}>
                    {currentMonth.getFullYear()}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.weekDaysContainer}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <Text key={index} style={styles.weekDayText}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.daysContainer}>
                {(() => {
                  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
                  const days = [];
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  for (let i = 0; i < startingDayOfWeek; i++) {
                    days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
                  }

                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    date.setHours(0, 0, 0, 0);
                    const isSelected = isSameDay(date, tempSelectedDate);
                    const isFuture = date > today;
                    days.push(
                      <TouchableOpacity
                        key={day}
                        style={styles.dayCell}
                        onPress={() => !isFuture && setTempSelectedDate(date)}
                        disabled={isFuture}
                      >
                        <View style={[styles.dayButton, isSelected && styles.dayButtonSelected, isFuture && styles.dayButtonDisabled]}>
                          <Text style={[styles.dayText, isSelected && styles.dayTextSelected, isFuture && styles.dayTextDisabled]}>
                            {day}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }

                  return days;
                })()}
              </View>
            </View>

            <View style={styles.datePickerFooter}>
              <TouchableOpacity
                onPress={() => {
                  setTempSelectedDate(null);
                  setShowDatePicker(null);
                }}
                style={styles.datePickerCancelButton}
              >
                <Text style={styles.datePickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => showDatePicker !== null && confirmDateSelection(showDatePicker)}
                style={styles.datePickerOkButton}
              >
                <Text style={styles.datePickerOkText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showYearPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowYearPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Year</Text>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <Text style={styles.pickerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {getYearsList().map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.pickerItem,
                    year === currentMonth.getFullYear() && styles.pickerItemActive
                  ]}
                  onPress={() => selectYear(year)}
                >
                  <Text style={[
                    styles.pickerItemText,
                    year === currentMonth.getFullYear() && styles.pickerItemTextActive
                  ]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showMonthPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Month</Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <Text style={styles.pickerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {getMonthsList().map((month, index) => {
                const testDate = new Date(currentMonth.getFullYear(), index, 1);
                const today = new Date();
                const isDisabled = testDate > today;
                const isSelected = index === currentMonth.getMonth();

                return (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.pickerItem,
                      isSelected && styles.pickerItemActive,
                      isDisabled && styles.pickerItemDisabled
                    ]}
                    onPress={() => !isDisabled && selectMonth(index)}
                    disabled={isDisabled}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      isSelected && styles.pickerItemTextActive,
                      isDisabled && styles.pickerItemTextDisabled
                    ]}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  inputBirthDate: {
    flex: 1,
  },
  datePickerButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 12,
  },
  datePickerText: {
    fontSize: 16,
    color: Colors.textDark,
  },
  datePickerPlaceholder: {
    color: Colors.lightGrey,
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
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerModal: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  datePickerHeader: {
    padding: 20,
    paddingBottom: 16,
  },
  datePickerTitle: {
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '500',
  },
  datePickerSelectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  datePickerSelectedDate: {
    fontSize: 32,
    fontWeight: '400',
    color: Colors.textDark,
  },
  calendarContainer: {
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  monthNavButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textDark,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  dayButtonSelected: {
    backgroundColor: '#0891b2',
  },
  dayButtonDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    color: Colors.textDark,
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  dayTextDisabled: {
    color: Colors.lightGrey,
  },
  datePickerFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    paddingTop: 12,
    gap: 16,
  },
  datePickerCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  datePickerCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0891b2',
  },
  datePickerOkButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  datePickerOkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0891b2',
  },
  monthYearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  dropdownArrow: {
    fontSize: 12,
    color: Colors.primary,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textDark,
  },
  pickerCloseText: {
    fontSize: 24,
    color: Colors.textLight,
  },
  pickerList: {
    flex: 1,
  },
  pickerItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerItemActive: {
    backgroundColor: '#E3F5FF',
  },
  pickerItemDisabled: {
    opacity: 0.3,
  },
  pickerItemText: {
    fontSize: 16,
    color: Colors.textDark,
    textAlign: 'center',
  },
  pickerItemTextActive: {
    fontWeight: '600',
    color: Colors.primary,
  },
  pickerItemTextDisabled: {
    color: Colors.lightGrey,
  },
});
