import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Phone, Globe, Mail, ExternalLink } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface ContactButtonsProps {
  phone?: string;
  email?: string;
  website?: string;
  translations: {
    visitWebsite: string;
  };
}

export default function ContactButtons({
  phone,
  email,
  website,
  translations,
}: ContactButtonsProps) {
  if (!phone && !email && !website) return null;

  return (
    <>
      {phone && (
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => Linking.openURL(`tel:${phone}`)}
        >
          <Phone size={20} color={Colors.primary} />
          <Text style={styles.contactButtonText}>{phone}</Text>
        </TouchableOpacity>
      )}
      {email && (
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => Linking.openURL(`mailto:${email}`)}
        >
          <Mail size={20} color={Colors.primary} />
          <Text style={styles.contactButtonText}>{email}</Text>
        </TouchableOpacity>
      )}
      {website && (
        <TouchableOpacity style={styles.contactButton} onPress={() => Linking.openURL(website)}>
          <Globe size={20} color={Colors.primary} />
          <Text style={styles.contactButtonText}>{translations.visitWebsite}</Text>
          <ExternalLink size={16} color={Colors.textLight} />
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.lightGrey,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  contactButtonText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
});
