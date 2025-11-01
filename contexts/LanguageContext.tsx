import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

type Language = 'en' | 'nl';

interface Translations {
  [key: string]: {
    en: string;
    nl: string;
  };
}

const translations: Translations = {
  'app.name': { en: 'KinderDag', nl: 'KinderDag' },
  'welcome.title': { en: 'Welcome to KinderDag', nl: 'Welkom bij KinderDag' },
  'welcome.subtitle': { en: 'Discover amazing activities for your kids', nl: 'Ontdek geweldige activiteiten voor je kinderen' },
  'auth.signin': { en: 'Sign In', nl: 'Inloggen' },
  'auth.signup': { en: 'Sign Up', nl: 'Registreren' },
  'auth.email': { en: 'Email', nl: 'E-mail' },
  'auth.password': { en: 'Password', nl: 'Wachtwoord' },
  'auth.fullname': { en: 'Full Name', nl: 'Volledige Naam' },
  'auth.signout': { en: 'Sign Out', nl: 'Uitloggen' },
  'nav.home': { en: 'Home', nl: 'Home' },
  'nav.explore': { en: 'Explore', nl: 'Ontdek' },
  'nav.whatsOn': { en: "What's On", nl: 'Agenda' },
  'nav.playSpots': { en: 'Play Spots', nl: 'Speelplekken' },
  'nav.saved': { en: 'Saved', nl: 'Bewaard' },
  'nav.discover': { en: 'Discover', nl: 'Ontdekken' },
  'nav.activities': { en: 'Activities', nl: 'Activiteiten' },
  'nav.favorites': { en: 'Favorites', nl: 'Favorieten' },
  'home.featured': { en: 'Featured Activities', nl: 'Uitgelichte Activiteiten' },
  'home.dontMiss': { en: "Don't Miss This Week", nl: 'Mis Deze Week Niet' },
  'home.seasonal': { en: 'Catch It Before It Ends', nl: 'Vang Het Voor Het Eindigt' },
  'home.categories': { en: 'Categories', nl: 'Categorieën' },
  'home.weather': { en: 'Weather Forecast', nl: 'Weersvoorspelling' },
  'activity.details': { en: 'Activity Details', nl: 'Activiteit Details' },
  'activity.book': { en: 'Book Now', nl: 'Nu Boeken' },
  'activity.bookTickets': { en: 'Book Tickets', nl: 'Tickets Boeken' },
  'activity.save': { en: 'Save to Favorites', nl: 'Opslaan als Favoriet' },
  'activity.saved': { en: 'Saved', nl: 'Opgeslagen' },
  'activity.ages': { en: 'Ages', nl: 'Leeftijden' },
  'activity.years': { en: 'years', nl: 'jaar' },
  'activity.price': { en: 'Price', nl: 'Prijs' },
  'activity.free': { en: 'Free', nl: 'Gratis' },
  'activity.indoor': { en: 'Indoor', nl: 'Binnen' },
  'activity.outdoor': { en: 'Outdoor', nl: 'Buiten' },
  'activity.rating': { en: 'Rating', nl: 'Beoordeling' },
  'activity.reviews': { en: 'Reviews', nl: 'Beoordelingen' },
  'activity.about': { en: 'About', nl: 'Over' },
  'activity.location': { en: 'Location', nl: 'Locatie' },
  'activity.contact': { en: 'Contact', nl: 'Contact' },
  'activity.collections': { en: 'Collections', nl: 'Collecties' },
  'activity.visitWebsite': { en: 'Visit Website', nl: 'Bezoek Website' },
  'venue.openToday': { en: 'Open Today', nl: 'Vandaag Open' },
  'venue.openingHours': { en: 'Opening Hours', nl: 'Openingstijden' },
  'venue.closed': { en: 'Closed', nl: 'Gesloten' },
  'venue.getDirections': { en: 'Get Directions', nl: 'Route Ophalen' },
  'venue.days.monday': { en: 'Monday', nl: 'Maandag' },
  'venue.days.tuesday': { en: 'Tuesday', nl: 'Dinsdag' },
  'venue.days.wednesday': { en: 'Wednesday', nl: 'Woensdag' },
  'venue.days.thursday': { en: 'Thursday', nl: 'Donderdag' },
  'venue.days.friday': { en: 'Friday', nl: 'Vrijdag' },
  'venue.days.saturday': { en: 'Saturday', nl: 'Zaterdag' },
  'venue.days.sunday': { en: 'Sunday', nl: 'Zondag' },
  'search.placeholder': { en: 'Search activities...', nl: 'Zoek activiteiten...' },
  'search.filter': { en: 'Filter', nl: 'Filter' },
  'search.sort': { en: 'Sort', nl: 'Sorteren' },
  'filter.age': { en: 'Age Range', nl: 'Leeftijdsbereik' },
  'filter.distance': { en: 'Distance', nl: 'Afstand' },
  'filter.price': { en: 'Price Range', nl: 'Prijsklasse' },
  'filter.type': { en: 'Activity Type', nl: 'Activiteit Type' },
  'favorites.empty': { en: 'No favorites yet', nl: 'Nog geen favorieten' },
  'favorites.addSome': { en: 'Start exploring and save your favorite activities', nl: 'Begin met verkennen en bewaar je favoriete activiteiten' },
  'calendar.schedule': { en: 'Schedule', nl: 'Planning' },
  'calendar.addActivity': { en: 'Add Activity', nl: 'Activiteit Toevoegen' },
  'profile.title': { en: 'Profile', nl: 'Profiel' },
  'profile.settings': { en: 'Settings', nl: 'Instellingen' },
  'profile.language': { en: 'Language', nl: 'Taal' },
  'profile.notifications': { en: 'Push Notifications', nl: 'Pushmeldingen' },
  'profile.location': { en: 'Location', nl: 'Locatie' },
  'onboarding.welcome': { en: 'Welcome!', nl: 'Welkom!' },
  'onboarding.language': { en: 'Choose Your Language', nl: 'Kies Je Taal' },
  'onboarding.profile': { en: 'Set Up Your Profile', nl: 'Stel Je Profiel In' },
  'onboarding.kids': { en: 'Tell Us About Your Kids', nl: 'Vertel Ons Over Je Kinderen' },
  'onboarding.location': { en: 'Enable Location', nl: 'Locatie Inschakelen' },
  'onboarding.permissions': { en: 'Allow Permissions', nl: 'Toestemmingen Geven' },
  'onboarding.next': { en: 'Next', nl: 'Volgende' },
  'onboarding.skip': { en: 'Skip', nl: 'Overslaan' },
  'onboarding.finish': { en: 'Finish', nl: 'Voltooien' },
  'common.loading': { en: 'Loading...', nl: 'Laden...' },
  'common.error': { en: 'Error', nl: 'Fout' },
  'common.retry': { en: 'Retry', nl: 'Opnieuw Proberen' },
  'common.cancel': { en: 'Cancel', nl: 'Annuleren' },
  'common.save': { en: 'Save', nl: 'Opslaan' },
  'common.delete': { en: 'Delete', nl: 'Verwijderen' },
  'common.edit': { en: 'Edit', nl: 'Bewerken' },
  'common.done': { en: 'Done', nl: 'Klaar' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const { profile, updateProfile } = useAuth();

  useEffect(() => {
    loadLanguage();
  }, [profile]);

  const loadLanguage = async () => {
    if (profile?.language) {
      setLanguageState(profile.language);
    } else {
      const stored = await AsyncStorage.getItem('language');
      if (stored === 'en' || stored === 'nl') {
        setLanguageState(stored);
      }
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem('language', lang);
    if (profile) {
      await updateProfile({ language: lang });
    }
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
