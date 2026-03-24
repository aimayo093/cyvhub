import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  MessageCircle,
  Phone,
  Mail,
  ChevronRight,
  HelpCircle,
  FileText,
  Shield,
  Send,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

const FAQ_ITEMS = [
  { q: 'How do I track my delivery?', a: 'Go to the Deliveries tab and tap on any active delivery to see real-time tracking and status updates.' },
  { q: 'How do I cancel a delivery?', a: 'Open the delivery details and tap "Cancel Delivery" at the bottom. You can only cancel before the package is picked up.' },
  { q: 'What vehicles are available?', a: 'We offer Motorbike, Small Van, Medium Van, and Large Van options depending on your package size.' },
  { q: 'How is pricing calculated?', a: 'Prices are based on vehicle type, distance, and delivery urgency. You see the estimated price before confirming.' },
  { q: 'How do I become a driver?', a: 'Sign up as a driver through the app. You will need to provide your licence details and complete our onboarding process.' },
];

export default function SupportScreen() {
  const { userRole } = useAuth();
  const accent = userRole === 'driver' ? Colors.primary : userRole === 'admin' ? Colors.adminPrimary : Colors.customerPrimary;
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('');

  const handleSendMessage = useCallback(() => {
    if (!message.trim()) {
      Alert.alert('Empty Message', 'Please type a message before sending.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Message Sent',
      'Thanks for reaching out! Our support team will get back to you within 24 hours.',
      [{ text: 'OK' }]
    );
    setMessage('');
  }, [message]);

  const handleCallSupport = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('tel:+442071234567');
  }, []);

  const handleEmailSupport = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('mailto:support@cyvhub.com');
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Help & Support',
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contactCards}>
          <TouchableOpacity style={styles.contactCard} onPress={handleCallSupport} activeOpacity={0.7}>
            <View style={[styles.contactIcon, { backgroundColor: '#DBEAFE' }]}>
              <Phone size={20} color={Colors.primary} />
            </View>
            <Text style={styles.contactLabel}>Call Us</Text>
            <Text style={styles.contactDetail}>Mon-Fri 9am-6pm</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport} activeOpacity={0.7}>
            <View style={[styles.contactIcon, { backgroundColor: '#CCFBF1' }]}>
              <Mail size={20} color={Colors.customerPrimary} />
            </View>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactDetail}>support@cyvhub.com</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <HelpCircle size={18} color={accent} />
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          </View>
          <View style={styles.faqList}>
            {FAQ_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.faqItem, index === FAQ_ITEMS.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => {
                  setExpandedFaq(expandedFaq === index ? null : index);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.faqQuestion}>
                  <Text style={styles.faqQuestionText}>{item.q}</Text>
                  <ChevronRight
                    size={16}
                    color={Colors.textMuted}
                    style={{ transform: [{ rotate: expandedFaq === index ? '90deg' : '0deg' }] }}
                  />
                </View>
                {expandedFaq === index && (
                  <Text style={styles.faqAnswer}>{item.a}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageCircle size={18} color={accent} />
            <Text style={styles.sectionTitle}>Send Us a Message</Text>
          </View>
          <View style={styles.messageCard}>
            <TextInput
              style={styles.messageInput}
              placeholder="Describe your issue or question..."
              placeholderTextColor={Colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              textAlignVertical="top"
              testID="support-message"
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: accent }]}
              onPress={handleSendMessage}
              activeOpacity={0.8}
            >
              <Send size={16} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={18} color={accent} />
            <Text style={styles.sectionTitle}>Legal</Text>
          </View>
          <View style={styles.legalCard}>
            <TouchableOpacity style={styles.legalItem} activeOpacity={0.7}>
              <Shield size={16} color={Colors.textMuted} />
              <Text style={styles.legalText}>Privacy Policy</Text>
              <ChevronRight size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.legalItem, { borderBottomWidth: 0 }]} activeOpacity={0.7}>
              <FileText size={16} color={Colors.textMuted} />
              <Text style={styles.legalText}>Terms & Conditions</Text>
              <ChevronRight size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.responseInfo}>
          <Clock size={14} color={Colors.textMuted} />
          <Text style={styles.responseText}>Average response time: under 2 hours</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  contactCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  contactCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  contactDetail: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  faqList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  faqItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  faqAnswer: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  messageCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  messageInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    minHeight: 100,
    fontSize: 14,
    color: Colors.text,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: 46,
    gap: 8,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  legalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  legalText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
  },
  responseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  responseText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
