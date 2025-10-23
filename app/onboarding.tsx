import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { citiesService } from '@/services/cities';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  titleKey: string;
  subtitleKey?: string;
}

const steps: OnboardingStep[] = [
  { id: 'language', titleKey: 'onboarding.language' },
  { id: 'kids', titleKey: 'onboarding.kids', subtitleKey: 'Tell us about your children to get personalized recommendations' },
  { id: 'location', titleKey: 'onboarding.location', subtitleKey: 'Help us find activities near you' },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [kids, setKids] = useState<{ name: string; birthYear: string }[]>([{ name: '', birthYear: '' }]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { user, updateProfile, refreshProfile } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const data = await citiesService.getAll();
      setCities(data);
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const handleNext = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (currentIndex === 0 && user) {
        await supabase
          .from('profiles')
          .update({ language })
          .eq('id', user.id);
        await refreshProfile();
      }

      if (currentIndex < steps.length - 1) {
        setCurrentIndex(currentIndex + 1);
        flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      } else {
        await handleFinish();
      }
    } catch (error) {
      console.error('Error in handleNext:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const validKids = kids.filter(kid => kid.birthYear && parseInt(kid.birthYear) > 1900);

      if (validKids.length > 0 && user) {
        for (const kid of validKids) {
          await supabase.from('kids').insert({
            profile_id: user.id,
            name: kid.name || null,
            birth_year: parseInt(kid.birthYear),
          });
        }
      }

      await refreshProfile();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error finishing onboarding:', error);
      setIsProcessing(false);
    }
  };

  const selectCity = async (city: string) => {
    setSelectedCity(city);
    setShowCityPicker(false);

    try {
      const coords = await citiesService.getCityCoordinates(city);
      if (coords && user) {
        await supabase
          .from('profiles')
          .update({
            location_lat: coords.lat,
            location_lng: coords.lng,
            location_name: city,
          })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Failed to select city:', error);
    }
  };

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          console.log('Location permission denied');
        } else {
          Alert.alert('Permission Denied', 'Location permission is required to find activities near you');
        }
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const locationName = geocode[0]?.city || geocode[0]?.region || 'Unknown';
      setSelectedCity(locationName);

      if (user) {
        await supabase
          .from('profiles')
          .update({
            location_lat: location.coords.latitude,
            location_lng: location.coords.longitude,
            location_name: locationName,
          })
          .eq('id', user.id);
      }

      if (Platform.OS !== 'web') {
        Alert.alert('Success', `Location set to ${locationName}`);
      }
    } catch (error) {
      console.error('Location error:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to get location');
      }
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

  const renderStep = ({ item }: { item: OnboardingStep }) => {
    return (
      <View style={styles.step}>
        <Text style={styles.stepTitle}>{t(item.titleKey)}</Text>
        {item.subtitleKey && <Text style={styles.stepSubtitle}>{item.subtitleKey}</Text>}

        {item.id === 'language' && (
          <View style={styles.languageContainer}>
            <TouchableOpacity
              style={[styles.languageButton, language === 'en' && styles.languageButtonActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.languageText, language === 'en' && styles.languageTextActive]}>
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageButton, language === 'nl' && styles.languageButtonActive]}
              onPress={() => setLanguage('nl')}
            >
              <Text style={[styles.languageText, language === 'nl' && styles.languageTextActive]}>
                Nederlands
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {item.id === 'kids' && (
          <View style={styles.kidsContainer}>
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
          </View>
        )}

        {item.id === 'location' && (
          <View style={styles.locationContainer}>
            <TouchableOpacity
              style={styles.cityPickerButton}
              onPress={() => setShowCityPicker(!showCityPicker)}
            >
              <Text style={styles.cityPickerButtonText}>
                {selectedCity || 'Select your city'}
              </Text>
              <Text style={styles.dropdownArrow}>{showCityPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showCityPicker && (
              <View style={styles.cityPickerDropdown}>
                <FlatList
                  data={cities}
                  keyExtractor={(city) => city}
                  renderItem={({ item: city }) => (
                    <TouchableOpacity
                      style={styles.cityOption}
                      onPress={() => selectCity(city)}
                    >
                      <Text style={styles.cityOptionText}>{city}</Text>
                    </TouchableOpacity>
                  )}
                  style={styles.cityList}
                />
              </View>
            )}

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.locationButton} onPress={requestLocation}>
              <Text style={styles.locationButtonText}>Use My Location</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleFinish}>
              <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={steps}
        renderItem={renderStep}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.flatList}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[styles.paginationDot, currentIndex === index && styles.paginationDotActive]}
            />
          ))}
        </View>

        {steps[currentIndex].id !== 'location' && (
          <TouchableOpacity
            style={[styles.nextButton, isProcessing && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={isProcessing}
          >
            <Text style={styles.nextButtonText}>
              {isProcessing ? t('common.loading') : (currentIndex === steps.length - 1 ? t('onboarding.finish') : t('onboarding.next'))}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  step: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 48,
    opacity: 0.9,
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
  kidsContainer: {
    width: '100%',
    maxWidth: 400,
  },
  kidForm: {
    marginBottom: 16,
  },
  kidRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
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
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  locationContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  cityPickerButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cityPickerButtonText: {
    color: Colors.textDark,
    fontSize: 18,
    fontWeight: '600',
  },
  dropdownArrow: {
    color: Colors.textDark,
    fontSize: 16,
  },
  cityPickerDropdown: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    width: '100%',
    maxHeight: 200,
    marginBottom: 16,
  },
  cityList: {
    maxHeight: 200,
  },
  cityOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cityOptionText: {
    color: Colors.textDark,
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 16,
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
  locationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  locationButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: {
    color: Colors.white,
    fontSize: 16,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    paddingBottom: 48,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  paginationDotActive: {
    backgroundColor: Colors.white,
    width: 24,
  },
  nextButton: {
    backgroundColor: Colors.textDark,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
