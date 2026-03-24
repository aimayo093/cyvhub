import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  Star,
  X,
  Lock,
  Shield,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePayments } from '@/providers/PaymentProvider';

const PAYPAL_BLUE = '#0070BA';

function CardIcon({ brand, size = 24 }: { brand: string; size?: number }) {
  const color = brand === 'visa' ? '#1A1F71' : brand === 'mastercard' ? '#EB001B' : '#006FCF';
  const label = brand === 'visa' ? 'VISA' : brand === 'mastercard' ? 'MC' : 'AMEX';
  return (
    <View style={[ciStyles.container, { backgroundColor: color + '12', borderColor: color + '25' }]}>
      <Text style={[ciStyles.text, { color }]}>{label}</Text>
    </View>
  );
}

const ciStyles = StyleSheet.create({
  container: { width: 48, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  text: { fontSize: 11, fontWeight: '800' as const },
});

export default function PaymentMethodsScreen() {
  const {
    cards, paypalAccounts,
    addCard, removeCard, setDefaultCard,
    addPaypalAccount, setDefaultPaypal, removePaypalAccount,
  } = usePayments();

  const [showAddCard, setShowAddCard] = useState<boolean>(false);
  const [showAddPaypal, setShowAddPaypal] = useState<boolean>(false);
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvc, setCardCvc] = useState<string>('');
  const [paypalEmail, setPaypalEmail] = useState<string>('');

  const handleRemoveCard = useCallback((cardId: string, last4: string) => {
    Alert.alert('Remove Card', `Remove card ending in ${last4}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        removeCard(cardId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }},
    ]);
  }, [removeCard]);

  const handleSetDefault = useCallback((cardId: string) => {
    setDefaultCard(cardId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [setDefaultCard]);

  const handleSetDefaultPaypal = useCallback((accountId: string) => {
    setDefaultPaypal(accountId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [setDefaultPaypal]);

  const handleAddCard = useCallback(() => {
    if (cardNumber.length < 16 || cardExpiry.length < 5 || cardCvc.length < 3) {
      Alert.alert('Invalid Card', 'Please enter valid card details.');
      return;
    }
    const parts = cardExpiry.split('/');
    const brands: Array<'visa' | 'mastercard' | 'amex'> = ['visa', 'mastercard', 'amex'];
    addCard({
      brand: brands[Math.floor(Math.random() * 2)],
      last4: cardNumber.slice(-4),
      expiryMonth: parseInt(parts[0], 10),
      expiryYear: parseInt('20' + parts[1], 10),
      isDefault: cards.length === 0,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setShowAddCard(false);
  }, [cardNumber, cardExpiry, cardCvc, addCard, cards.length]);

  const handleAddPaypal = useCallback(() => {
    if (!paypalEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid PayPal email.');
      return;
    }
    addPaypalAccount(paypalEmail);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPaypalEmail('');
    setShowAddPaypal(false);
  }, [paypalEmail, addPaypalAccount]);

  const formatExpiry = useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 3) return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    return cleaned;
  }, []);

  const defaultMethod = cards.find(c => c.isDefault) ? 'card' : paypalAccounts.find(p => p.isDefault) ? 'paypal' : cards.length > 0 ? 'card' : 'none';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Payment Methods',
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Shield size={20} color={Colors.customerPrimary} />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryTitle}>Secure Payments</Text>
            <Text style={styles.summarySub}>
              {cards.length} card{cards.length !== 1 ? 's' : ''} · {paypalAccounts.length} PayPal account{paypalAccounts.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={18} color={Colors.text} />
            <Text style={styles.sectionTitle}>Cards (Stripe)</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddCard(true)} activeOpacity={0.7}>
              <Plus size={16} color={Colors.customerPrimary} />
            </TouchableOpacity>
          </View>

          {cards.map(card => (
            <View key={card.id} style={[styles.methodItem, card.isDefault && styles.methodItemDefault]}>
              <CardIcon brand={card.brand} />
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>{card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} •••• {card.last4}</Text>
                <Text style={styles.methodDetail}>Expires {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}</Text>
              </View>
              {card.isDefault ? (
                <View style={styles.defaultBadge}>
                  <Star size={10} color={Colors.customerPrimary} />
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              ) : (
                <View style={styles.methodActions}>
                  <TouchableOpacity onPress={() => handleSetDefault(card.id)} style={styles.actionBtn}>
                    <CheckCircle size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemoveCard(card.id, card.last4)} style={styles.actionBtn}>
                    <Trash2 size={16} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          {cards.length === 0 && (
            <TouchableOpacity style={styles.emptyPrompt} onPress={() => setShowAddCard(true)} activeOpacity={0.7}>
              <CreditCard size={32} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No cards added</Text>
              <Text style={styles.emptySub}>Add a debit or credit card</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.ppIcon}>
              <Text style={styles.ppIconText}>P</Text>
            </View>
            <Text style={styles.sectionTitle}>PayPal</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddPaypal(true)} activeOpacity={0.7}>
              <Plus size={16} color={PAYPAL_BLUE} />
            </TouchableOpacity>
          </View>

          {paypalAccounts.map(acc => (
            <View key={acc.id} style={[styles.methodItem, acc.isDefault && styles.methodItemPaypalDefault]}>
              <View style={styles.ppItemIcon}>
                <Text style={styles.ppItemIconText}>P</Text>
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>{acc.email}</Text>
                <Text style={styles.methodDetail}>PayPal Account</Text>
              </View>
              {acc.isDefault ? (
                <View style={[styles.defaultBadge, { backgroundColor: PAYPAL_BLUE + '12' }]}>
                  <Star size={10} color={PAYPAL_BLUE} />
                  <Text style={[styles.defaultText, { color: PAYPAL_BLUE }]}>Default</Text>
                </View>
              ) : (
                <View style={styles.methodActions}>
                  <TouchableOpacity onPress={() => handleSetDefaultPaypal(acc.id)} style={styles.actionBtn}>
                    <CheckCircle size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { Alert.alert('Remove', `Remove ${acc.email}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => removePaypalAccount(acc.id) }]); }} style={styles.actionBtn}>
                    <Trash2 size={16} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          {paypalAccounts.length === 0 && (
            <TouchableOpacity style={styles.emptyPrompt} onPress={() => setShowAddPaypal(true)} activeOpacity={0.7}>
              <View style={styles.ppEmptyIcon}><Text style={styles.ppEmptyIconText}>P</Text></View>
              <Text style={styles.emptyTitle}>No PayPal linked</Text>
              <Text style={styles.emptySub}>Connect your PayPal account</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal visible={showAddCard} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Card</Text>
            <TouchableOpacity onPress={() => setShowAddCard(false)}><X size={24} color={Colors.text} /></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Card Number</Text>
              <View style={styles.formInput}>
                <CreditCard size={18} color={Colors.textMuted} />
                <TextInput style={styles.formTextInput} placeholder="1234 5678 9012 3456" placeholderTextColor={Colors.textMuted} value={cardNumber} onChangeText={t => setCardNumber(t.replace(/\D/g, '').slice(0, 16))} keyboardType="number-pad" maxLength={16} />
              </View>
            </View>
            <View style={styles.formRowInline}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Expiry</Text>
                <View style={styles.formInput}>
                  <TextInput style={styles.formTextInput} placeholder="MM/YY" placeholderTextColor={Colors.textMuted} value={cardExpiry} onChangeText={t => setCardExpiry(formatExpiry(t))} keyboardType="number-pad" maxLength={5} />
                </View>
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>CVC</Text>
                <View style={styles.formInput}>
                  <Lock size={16} color={Colors.textMuted} />
                  <TextInput style={styles.formTextInput} placeholder="123" placeholderTextColor={Colors.textMuted} value={cardCvc} onChangeText={t => setCardCvc(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" maxLength={4} secureTextEntry />
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.submitBtn} onPress={handleAddCard} activeOpacity={0.8}>
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Add Card</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showAddPaypal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Link PayPal</Text>
            <TouchableOpacity onPress={() => setShowAddPaypal(false)}><X size={24} color={Colors.text} /></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalContent}>
            <View style={styles.ppConnectBanner}>
              <View style={styles.ppConnectBannerIcon}><Text style={styles.ppConnectBannerIconText}>P</Text></View>
              <Text style={styles.ppConnectBannerTitle}>Connect your PayPal</Text>
              <Text style={styles.ppConnectBannerSub}>Enter your PayPal email to link your account for fast payments</Text>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>PayPal Email</Text>
              <View style={styles.formInput}>
                <TextInput style={styles.formTextInput} placeholder="your@email.com" placeholderTextColor={Colors.textMuted} value={paypalEmail} onChangeText={setPaypalEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
            </View>
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: PAYPAL_BLUE }]} onPress={handleAddPaypal} activeOpacity={0.8}>
              <Text style={styles.submitBtnText}>Link PayPal Account</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.customerPrimary + '30',
    gap: 12,
  },
  summaryInfo: { flex: 1 },
  summaryTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  summarySub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, flex: 1 },
  addBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  methodItemDefault: { borderColor: Colors.customerPrimary + '50', backgroundColor: Colors.customerPrimary + '04' },
  methodItemPaypalDefault: { borderColor: PAYPAL_BLUE + '50', backgroundColor: PAYPAL_BLUE + '04' },
  methodInfo: { flex: 1 },
  methodName: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  methodDetail: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.customerPrimary + '12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultText: { fontSize: 11, fontWeight: '600' as const, color: Colors.customerPrimary },
  methodActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 6 },
  ppIcon: { width: 20, height: 20, borderRadius: 4, backgroundColor: PAYPAL_BLUE + '15', alignItems: 'center', justifyContent: 'center' },
  ppIconText: { fontSize: 12, fontWeight: '800' as const, color: PAYPAL_BLUE, fontStyle: 'italic' },
  ppItemIcon: { width: 48, height: 32, borderRadius: 6, backgroundColor: PAYPAL_BLUE + '12', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: PAYPAL_BLUE + '25' },
  ppItemIconText: { fontSize: 16, fontWeight: '800' as const, color: PAYPAL_BLUE, fontStyle: 'italic' },
  emptyPrompt: { alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 24, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  emptySub: { fontSize: 12, color: Colors.textMuted },
  ppEmptyIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: PAYPAL_BLUE + '12', alignItems: 'center', justifyContent: 'center' },
  ppEmptyIconText: { fontSize: 24, fontWeight: '800' as const, color: PAYPAL_BLUE, fontStyle: 'italic' },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '800' as const, color: Colors.text },
  modalBody: { flex: 1 },
  modalContent: { padding: 20 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary, marginBottom: 8 },
  formInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, height: 52, gap: 10 },
  formTextInput: { flex: 1, fontSize: 16, color: Colors.text },
  formRowInline: { flexDirection: 'row', gap: 12 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.customerPrimary, borderRadius: 14, height: 54, gap: 8, marginTop: 8 },
  submitBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
  ppConnectBanner: { alignItems: 'center', backgroundColor: PAYPAL_BLUE + '08', borderRadius: 16, padding: 24, marginBottom: 20, gap: 8 },
  ppConnectBannerIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: PAYPAL_BLUE + '15', alignItems: 'center', justifyContent: 'center' },
  ppConnectBannerIconText: { fontSize: 28, fontWeight: '800' as const, color: PAYPAL_BLUE, fontStyle: 'italic' },
  ppConnectBannerTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  ppConnectBannerSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});
