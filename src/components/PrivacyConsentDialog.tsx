import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';

interface PrivacyConsentDialogProps {
  visible: boolean;
  onAccept: (consents: ConsentPreferences) => void;
  onDecline: () => void;
  appName?: string;
}

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  personalization: boolean;
  healthDataProcessing: boolean;
  aiAnalysis: boolean;
  dataSharing: boolean;
}

const PrivacyConsentDialog: React.FC<PrivacyConsentDialogProps> = ({
  visible,
  onAccept,
  onDecline,
  appName = 'Jung Therapy App',
}) => {
  const [consents, setConsents] = useState<ConsentPreferences>({
    essential: true, // Always required
    analytics: false,
    personalization: false,
    healthDataProcessing: false,
    aiAnalysis: false,
    dataSharing: false,
  });

  const [showDetails, setShowDetails] = useState(false);

  const handleConsentChange = (key: keyof ConsentPreferences, value: boolean) => {
    if (key === 'essential') return; // Essential consent cannot be changed
    setConsents(prev => ({ ...prev, [key]: value }));
  };

  const handleAcceptAll = () => {
    const allConsents: ConsentPreferences = {
      essential: true,
      analytics: true,
      personalization: true,
      healthDataProcessing: true,
      aiAnalysis: true,
      dataSharing: false, // Keep data sharing opt-in only
    };
    setConsents(allConsents);
    onAccept(allConsents);
  };

  const handleAcceptSelected = () => {
    if (!consents.healthDataProcessing) {
      Alert.alert(
        'Health Data Processing Required',
        'To use this mental health app, we need your consent to process your health and therapy data. This is essential for the app to function properly.',
        [
          {
            text: 'Review Settings',
            style: 'cancel',
          },
          {
            text: 'Enable Health Data Processing',
            onPress: () => {
              const updatedConsents = { ...consents, healthDataProcessing: true };
              setConsents(updatedConsents);
              onAccept(updatedConsents);
            },
          },
        ]
      );
      return;
    }
    onAccept(consents);
  };

  const handleDecline = () => {
    Alert.alert(
      'Cannot Use App',
      'Without essential privacy consents, particularly health data processing, this mental health app cannot function. Would you like to review the privacy policy or exit?',
      [
        {
          text: 'Review Privacy Policy',
          onPress: () => openPrivacyPolicy(),
        },
        {
          text: 'Exit App',
          onPress: onDecline,
          style: 'destructive',
        },
        {
          text: 'Review Settings',
          style: 'cancel',
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    // Replace with your actual privacy policy URL
    Linking.openURL('https://your-app-domain.com/privacy-policy');
  };

  const openTermsOfService = () => {
    // Replace with your actual terms of service URL
    Linking.openURL('https://your-app-domain.com/terms-of-service');
  };

  const ConsentOption: React.FC<{
    title: string;
    description: string;
    required?: boolean;
    enabled: boolean;
    onToggle: (value: boolean) => void;
  }> = ({ title, description, required = false, enabled, onToggle }) => (
    <View style={styles.consentOption}>
      <View style={styles.consentHeader}>
        <Text style={styles.consentTitle}>
          {title}{required ? ' *' : ''}
        </Text>
        <TouchableOpacity
          style={[
            styles.toggle,
            enabled ? styles.toggleEnabled : styles.toggleDisabled,
            required ? styles.toggleRequired : null,
          ]}
          onPress={() => !required && onToggle(!enabled)}
          disabled={required}
        >
          <View style={[styles.toggleKnob, enabled ? styles.toggleKnobActive : null]} />
        </TouchableOpacity>
      </View>
      <Text style={styles.consentDescription}>{description}</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleDecline}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Privacy & Consent</Text>
          <Text style={styles.subtitle}>
            Your privacy matters. Please review and choose your preferences.
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.introText}>
            {appName} processes personal and health information to provide mental health support. 
            Your data is protected and never sold to third parties.
          </Text>

          <View style={styles.consentSection}>
            <ConsentOption
              title="Essential Services"
              description="Required for app functionality, account management, and secure data storage. Cannot be disabled."
              required={true}
              enabled={consents.essential}
              onToggle={() => {}}
            />

            <ConsentOption
              title="Health Data Processing"
              description="Process your therapy conversations, mood data, and mental health insights to provide personalized support."
              required={true}
              enabled={consents.healthDataProcessing}
              onToggle={(value) => handleConsentChange('healthDataProcessing', value)}
            />

            <ConsentOption
              title="AI Analysis"
              description="Use AI to analyze your conversations and provide insights, suggestions, and personalized recommendations."
              enabled={consents.aiAnalysis}
              onToggle={(value) => handleConsentChange('aiAnalysis', value)}
            />

            <ConsentOption
              title="Personalization"
              description="Customize your experience based on your preferences, usage patterns, and therapy goals."
              enabled={consents.personalization}
              onToggle={(value) => handleConsentChange('personalization', value)}
            />

            <ConsentOption
              title="Analytics"
              description="Help improve the app by sharing anonymous usage statistics and performance data."
              enabled={consents.analytics}
              onToggle={(value) => handleConsentChange('analytics', value)}
            />

            <ConsentOption
              title="Research Data Sharing"
              description="Contribute anonymized data to mental health research (with strict privacy protections)."
              enabled={consents.dataSharing}
              onToggle={(value) => handleConsentChange('dataSharing', value)}
            />
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalText}>
              By continuing, you agree to our{' '}
              <Text style={styles.link} onPress={openTermsOfService}>
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text style={styles.link} onPress={openPrivacyPolicy}>
                Privacy Policy
              </Text>
              .
            </Text>
            
            <Text style={styles.disclaimer}>
              * Required for core app functionality. You can change non-essential 
              preferences anytime in Settings.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
          
          <View style={styles.acceptButtons}>
            <TouchableOpacity style={styles.acceptSelectedButton} onPress={handleAcceptSelected}>
              <Text style={styles.acceptSelectedText}>Accept Selected</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.acceptAllButton} onPress={handleAcceptAll}>
              <Text style={styles.acceptAllText}>Accept All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 24,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  introText: {
    fontSize: 16,
    color: '#444444',
    lineHeight: 24,
    marginBottom: 24,
  },
  consentSection: {
    marginBottom: 24,
  },
  consentOption: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  consentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  consentDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ccc',
    padding: 2,
    justifyContent: 'center',
  },
  toggleEnabled: {
    backgroundColor: '#007AFF',
  },
  toggleDisabled: {
    backgroundColor: '#ccc',
  },
  toggleRequired: {
    backgroundColor: '#28a745',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  legalSection: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 24,
  },
  legalText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999999',
    lineHeight: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    padding: 24,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    backgroundColor: '#ffffff',
  },
  declineButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc3545',
    marginBottom: 12,
  },
  declineText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  acceptButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptSelectedButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#6c757d',
  },
  acceptSelectedText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  acceptAllButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  acceptAllText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default PrivacyConsentDialog;
export { PrivacyConsentDialog };
export type { ConsentPreferences };
