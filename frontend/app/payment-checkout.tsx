import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import {
  CreditCard,
  CheckCircle,
  Shield,
  ChevronRight,
  X,
  Plus,
  Lock,
  Zap,
  ExternalLink,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePayments } from '@/providers/PaymentProvider';
import { useDeliveries } from '@/providers/DeliveriesProvider';
import { PaymentMethod, PaymentCard } from '@/types';

const PAYPAL_BLUE = '#0070BA';
const STRIPE_PURPLE = '#635BFF';

function CardIcon({ brand, size = 20 }: { brand: string; size?: number }) {
  const color = brand === 'visa' ? '#1A1F71' : brand === 'mastercard' ? '#EB001B' : '#006FCF';
  const label = brand === 'visa' ? 'V' : brand === 'mastercard' ? 'M' : 'A';
  return (
    <View style={[cardIconStyles.container, { width: size + 8, height: size, backgroundColor: color + '15', borderColor: color + '30' }]}>
      <Text style={[cardIconStyles.text, { fontSize: size * 0.55, color }]}>{label}</Text>
    </View>
  );
}

const cardIconStyles = StyleSheet.create({
  container: { borderRadius: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  text: { fontWeight: '800' as const },
});

export default function PaymentCheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string; description?: string; deliveryId?: string; trackingNumber?: string }>();
  const { cards, paypalAccounts, processPayment, addCard, initiateStripeCheckout, handlePaymentReturn } = usePayments();
  const { updateDeliveryPayment } = useDeliveries();

  const amount = parseFloat(params.amount ?? '0');
  const description = params.description ?? 'Delivery Payment';

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('stripe');
  const [selectedCardId, setSelectedCardId] = useState<string>(cards.find(c => c.isDefault)?.id ?? cards[0]?.id ?? '');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [showAddCard, setShowAddCard] = useState<boolean>(false);
  const [isStripeRedirecting, setIsStripeRedirecting] = useState<boolean>(false);

  const [newCardNumber, setNewCardNumber] = useState<string>('');
  const [newCardExpiry, setNewCardExpiry] = useState<string>('');
  const [newCardCvc, setNewCardCvc] = useState<string>('');

  const successAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isComplete) {
      Animated.spring(successAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [isComplete, successAnim]);

  useEffect(() => {
    if (isProcessing) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.95, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isProcessing, pulseAnim]);

  const handlePay = useCallback(async () => {
    if (amount <= 0) {
      Alert.alert('Error', 'Invalid payment amount');
      return;
    }

    if (selectedMethod === 'stripe' && !selectedCardId) {
      Alert.alert('No Card', 'Please add a card or select PayPal.');
      return;
    }

    if (selectedMethod === 'paypal' && paypalAccounts.length === 0) {
      Alert.alert('No PayPal', 'Please link a PayPal account first.');
      return;
    }

    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await processPayment(
        amount,
        selectedMethod,
        description,
        params.deliveryId,
        params.trackingNumber,
      );
      if (params.deliveryId) {
        updateDeliveryPayment(params.deliveryId, 'COMPLETED');
      }
      setIsProcessing(false);
      setIsComplete(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setIsProcessing(false);
      const errorMsg = e?.message || 'Please try again or use a different payment method.';
      Alert.alert('Payment Failed', errorMsg);
    }
  }, [amount, selectedMethod, selectedCardId, paypalAccounts, processPayment, description, params, updateDeliveryPayment]);

  // Stripe Checkout flow — demo mode auto-simulates the redirect and payment completion
  const handleStripeCheckout = useCallback(async () => {
    if (amount <= 0) {
      Alert.alert('Error', 'Invalid payment amount');
      return;
    }

    setIsStripeRedirecting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { sessionId, transaction } = await initiateStripeCheckout(
        amount,
        description,
        params.deliveryId,
        params.trackingNumber,
      );

      // Demo: simulate redirect and auto-complete after 2 seconds
      setTimeout(async () => {
        const result = await handlePaymentReturn('cyvhub://payment-success');
        if (result.success && params.deliveryId) {
          updateDeliveryPayment(params.deliveryId, 'COMPLETED');
        }
        setIsStripeRedirecting(false);
        setIsComplete(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 2000);
    } catch (e: any) {
      setIsStripeRedirecting(false);
      const errorMsg = e?.message || 'Could not connect to Stripe. Please try another method.';
      Alert.alert('Checkout Failed', errorMsg);
    }
  }, [amount, description, params, initiateStripeCheckout, handlePaymentReturn, updateDeliveryPayment]);

  const handleAddCard = useCallback(() => {
    if (newCardNumber.length < 16 || newCardExpiry.length < 5 || newCardCvc.length < 3) {
      Alert.alert('Invalid Card', 'Please enter valid card details.');
      return;
    }

    const parts = newCardExpiry.split('/');
    const month = parseInt(parts[0], 10);
    const year = parseInt('20' + parts[1], 10);

    const brands: Array<'visa' | 'mastercard' | 'amex'> = ['visa', 'mastercard', 'amex'];
    const brand = brands[Math.floor(Math.random() * 2)] as 'visa' | 'mastercard' | 'amex';

    addCard({
      brand,
      last4: newCardNumber.slice(-4),
      expiryMonth: month,
      expiryYear: year,
      isDefault: cards.length === 0,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewCardNumber('');
    setNewCardExpiry('');
    setNewCardCvc('');
    setShowAddCard(false);
    Alert.alert('Card Added', 'Your new card has been saved.');
  }, [newCardNumber, newCardExpiry, newCardCvc, addCard, cards.length]);

  const formatExpiry = useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 3) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  }, []);

  if (isComplete) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.successContainer}>
          <Animated.View style={[styles.successCircle, {
            transform: [{ scale: successAnim }],
            opacity: successAnim,
          }]}>
            <CheckCircle size={56} color={Colors.success} />
          </Animated.View>
          <Animated.Text style={[styles.successTitle, { opacity: successAnim }]}>
            Payment Successful
          </Animated.Text>
          <Animated.Text style={[styles.successAmount, { opacity: successAnim }]}>
            £{amount.toFixed(2)}
          </Animated.Text>
          <Animated.Text style={[styles.successDesc, { opacity: successAnim }]}>
            {description}
          </Animated.Text>
          <View style={styles.successMethodRow}>
            {selectedMethod === 'stripe' ? (
              <>
                <CreditCard size={14} color={Colors.textSecondary} />
                <Text style={styles.successMethodText}>
                  Paid with card ending {cards.find(c => c.id === selectedCardId)?.last4 ?? '****'}
                </Text>
              </>
            ) : (
              <Text style={[styles.successMethodText, { color: PAYPAL_BLUE }]}>
                Paid with PayPal
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.successBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Payment',
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>£{amount.toFixed(2)}</Text>
          <Text style={styles.amountDesc}>{description}</Text>
          <View style={styles.secureRow}>
            <Lock size={12} color={Colors.success} />
            <Text style={styles.secureText}>Secured with 256-bit encryption</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.methodRow}>
            <TouchableOpacity
              style={[styles.methodCard, selectedMethod === 'stripe' && styles.methodCardActive]}
              onPress={() => { setSelectedMethod('stripe'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              activeOpacity={0.7}
            >
              <CreditCard size={24} color={selectedMethod === 'stripe' ? Colors.customerPrimary : Colors.textMuted} />
              <Text style={[styles.methodLabel, selectedMethod === 'stripe' && styles.methodLabelActive]}>
                Card
              </Text>
              <Text style={styles.methodSub}>Stripe</Text>
              {selectedMethod === 'stripe' && (
                <View style={styles.methodCheck}>
                  <CheckCircle size={16} color={Colors.customerPrimary} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.methodCard, selectedMethod === 'paypal' && styles.methodCardActivePaypal]}
              onPress={() => { setSelectedMethod('paypal'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.paypalLogo, selectedMethod === 'paypal' && { color: PAYPAL_BLUE }]}>P</Text>
              <Text style={[styles.methodLabel, selectedMethod === 'paypal' && { color: PAYPAL_BLUE }]}>
                PayPal
              </Text>
              <Text style={styles.methodSub}>Quick pay</Text>
              {selectedMethod === 'paypal' && (
                <View style={[styles.methodCheck, { backgroundColor: PAYPAL_BLUE + '15' }]}>
                  <CheckCircle size={16} color={PAYPAL_BLUE} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {selectedMethod === 'stripe' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Select Card</Text>
              <TouchableOpacity
                style={styles.addCardBtn}
                onPress={() => setShowAddCard(true)}
                activeOpacity={0.7}
              >
                <Plus size={14} color={Colors.customerPrimary} />
                <Text style={styles.addCardText}>Add</Text>
              </TouchableOpacity>
            </View>

            {cards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[styles.cardItem, selectedCardId === card.id && styles.cardItemActive]}
                onPress={() => { setSelectedCardId(card.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                activeOpacity={0.7}
              >
                <CardIcon brand={card.brand} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardBrand}>{card.brand.charAt(0).toUpperCase() + card.brand.slice(1)}</Text>
                  <Text style={styles.cardLast4}>•••• {card.last4}</Text>
                </View>
                <Text style={styles.cardExpiry}>{String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}</Text>
                {selectedCardId === card.id && <CheckCircle size={18} color={Colors.customerPrimary} />}
              </TouchableOpacity>
            ))}

            {cards.length === 0 && (
              <TouchableOpacity
                style={styles.emptyCardPrompt}
                onPress={() => setShowAddCard(true)}
                activeOpacity={0.7}
              >
                <CreditCard size={28} color={Colors.textMuted} />
                <Text style={styles.emptyCardText}>No cards saved</Text>
                <Text style={styles.emptyCardSub}>Tap to add a card</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {selectedMethod === 'paypal' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PayPal Account</Text>
            {paypalAccounts.length > 0 ? (
              paypalAccounts.map(acc => (
                <View key={acc.id} style={styles.paypalItem}>
                  <View style={styles.paypalIcon}>
                    <Text style={styles.paypalIconText}>P</Text>
                  </View>
                  <View style={styles.paypalInfo}>
                    <Text style={styles.paypalEmail}>{acc.email}</Text>
                    <Text style={styles.paypalLabel}>PayPal Account</Text>
                  </View>
                  <CheckCircle size={18} color={PAYPAL_BLUE} />
                </View>
              ))
            ) : (
              <View style={styles.paypalConnectCard}>
                <View style={styles.paypalConnectIcon}>
                  <Text style={styles.paypalConnectIconText}>P</Text>
                </View>
                <Text style={styles.paypalConnectTitle}>Connect PayPal</Text>
                <Text style={styles.paypalConnectSub}>You'll be redirected to PayPal to authorize payment</Text>
                <TouchableOpacity style={styles.paypalConnectBtn} activeOpacity={0.8}>
                  <Text style={styles.paypalConnectBtnText}>Connect PayPal Account</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Delivery cost</Text>
            <Text style={styles.breakdownValue}>£{(amount * 0.83).toFixed(2)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>VAT (20%)</Text>
            <Text style={styles.breakdownValue}>£{(amount * 0.17).toFixed(2)}</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownTotalLabel}>Total</Text>
            <Text style={styles.breakdownTotalValue}>£{amount.toFixed(2)}</Text>
          </View>
        </View>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[
              styles.payBtn,
              isProcessing && styles.payBtnProcessing,
              selectedMethod === 'paypal' && styles.payBtnPaypal,
            ]}
            onPress={handlePay}
            disabled={isProcessing}
            activeOpacity={0.8}
            testID="pay-button"
          >
            {isProcessing ? (
              <View style={styles.processingRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.payBtnText}>Processing...</Text>
              </View>
            ) : (
              <>
                {selectedMethod === 'stripe' ? (
                  <Lock size={18} color="#FFFFFF" />
                ) : (
                  <Zap size={18} color="#FFFFFF" />
                )}
                <Text style={styles.payBtnText}>
                  Pay £{amount.toFixed(2)} with {selectedMethod === 'stripe' ? 'Card' : 'PayPal'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.trustRow}>
          <Shield size={14} color={Colors.textMuted} />
          <Text style={styles.trustText}>
            Payments processed securely by {selectedMethod === 'stripe' ? 'Stripe' : 'PayPal'}
          </Text>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.stripeCheckoutBtn, isStripeRedirecting && { opacity: 0.7 }]}
          onPress={handleStripeCheckout}
          disabled={isStripeRedirecting || isProcessing}
          activeOpacity={0.8}
          testID="stripe-checkout-button"
        >
          {isStripeRedirecting ? (
            <View style={styles.processingRow}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.stripeCheckoutBtnText}>Redirecting to Stripe...</Text>
            </View>
          ) : (
            <>
              <ExternalLink size={18} color="#FFFFFF" />
              <Text style={styles.stripeCheckoutBtnText}>
                Pay £{amount.toFixed(2)} via Stripe Checkout
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.trustRow}>
          <Lock size={14} color={STRIPE_PURPLE} />
          <Text style={[styles.trustText, { color: STRIPE_PURPLE }]}>
            Stripe Checkout opens a secure hosted payment page
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddCard} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Card</Text>
            <TouchableOpacity onPress={() => setShowAddCard(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalContent}>
            <View style={styles.cardFormSection}>
              <Text style={styles.formLabel}>Card Number</Text>
              <View style={styles.formInput}>
                <CreditCard size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.formTextInput}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={Colors.textMuted}
                  value={newCardNumber}
                  onChangeText={(text) => setNewCardNumber(text.replace(/\D/g, '').slice(0, 16))}
                  keyboardType="number-pad"
                  maxLength={16}
                  testID="card-number"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.cardFormSection, { flex: 1 }]}>
                <Text style={styles.formLabel}>Expiry</Text>
                <View style={styles.formInput}>
                  <TextInput
                    style={styles.formTextInput}
                    placeholder="MM/YY"
                    placeholderTextColor={Colors.textMuted}
                    value={newCardExpiry}
                    onChangeText={(text) => setNewCardExpiry(formatExpiry(text))}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
              </View>
              <View style={[styles.cardFormSection, { flex: 1 }]}>
                <Text style={styles.formLabel}>CVC</Text>
                <View style={styles.formInput}>
                  <Lock size={16} color={Colors.textMuted} />
                  <TextInput
                    style={styles.formTextInput}
                    placeholder="123"
                    placeholderTextColor={Colors.textMuted}
                    value={newCardCvc}
                    onChangeText={(text) => setNewCardCvc(text.replace(/\D/g, '').slice(0, 4))}
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.addCardSubmitBtn}
              onPress={handleAddCard}
              activeOpacity={0.8}
            >
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.addCardSubmitText}>Add Card</Text>
            </TouchableOpacity>

            <View style={styles.trustRow}>
              <Shield size={14} color={Colors.textMuted} />
              <Text style={styles.trustText}>Card details are encrypted and stored securely by Stripe</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: {
    padding: 16,
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
    width: '100%',
    alignSelf: 'center',
  },
  amountCard: {
    backgroundColor: Colors.navy,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: { fontSize: 13, color: Colors.textMuted, marginBottom: 4 },
  amountValue: { fontSize: 42, fontWeight: '800' as const, color: Colors.textInverse, letterSpacing: -1 },
  amountDesc: { fontSize: 14, color: Colors.textMuted, marginTop: 6 },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, backgroundColor: 'rgba(16,185,129,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  secureText: { fontSize: 11, color: Colors.success, fontWeight: '600' as const },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  methodRow: { flexDirection: 'row', gap: 12 },
  methodCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 6,
  },
  methodCardActive: { borderColor: Colors.customerPrimary, backgroundColor: Colors.customerPrimary + '08' },
  methodCardActivePaypal: { borderColor: PAYPAL_BLUE, backgroundColor: PAYPAL_BLUE + '08' },
  methodLabel: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  methodLabelActive: { color: Colors.customerPrimary },
  methodSub: { fontSize: 11, color: Colors.textMuted },
  methodCheck: { position: 'absolute', top: 10, right: 10, backgroundColor: Colors.customerPrimary + '15', borderRadius: 10, padding: 2 },
  paypalLogo: { fontSize: 28, fontWeight: '800' as const, color: Colors.textMuted, fontStyle: 'italic' },
  addCardBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.customerPrimary + '12', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addCardText: { fontSize: 13, fontWeight: '600' as const, color: Colors.customerPrimary },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 12,
  },
  cardItemActive: { borderColor: Colors.customerPrimary, backgroundColor: Colors.customerPrimary + '06' },
  cardInfo: { flex: 1 },
  cardBrand: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  cardLast4: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cardExpiry: { fontSize: 12, color: Colors.textMuted, marginRight: 8 },
  emptyCardPrompt: { alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 24, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', gap: 6 },
  emptyCardText: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  emptyCardSub: { fontSize: 12, color: Colors.textMuted },
  paypalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: PAYPAL_BLUE,
    gap: 12,
  },
  paypalIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: PAYPAL_BLUE + '15', alignItems: 'center', justifyContent: 'center' },
  paypalIconText: { fontSize: 18, fontWeight: '800' as const, color: PAYPAL_BLUE, fontStyle: 'italic' },
  paypalInfo: { flex: 1 },
  paypalEmail: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  paypalLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  paypalConnectCard: { alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  paypalConnectIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: PAYPAL_BLUE + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  paypalConnectIconText: { fontSize: 24, fontWeight: '800' as const, color: PAYPAL_BLUE, fontStyle: 'italic' },
  paypalConnectTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  paypalConnectSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  paypalConnectBtn: { backgroundColor: PAYPAL_BLUE, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  paypalConnectBtnText: { fontSize: 14, fontWeight: '700' as const, color: '#FFFFFF' },
  breakdownCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  breakdownLabel: { fontSize: 14, color: Colors.textSecondary },
  breakdownValue: { fontSize: 14, fontWeight: '500' as const, color: Colors.text },
  breakdownDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 6 },
  breakdownTotalLabel: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  breakdownTotalValue: { fontSize: 18, fontWeight: '800' as const, color: Colors.customerPrimary },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.customerPrimary,
    borderRadius: 16,
    height: 58,
    gap: 8,
    marginBottom: 16,
  },
  payBtnPaypal: { backgroundColor: PAYPAL_BLUE },
  payBtnProcessing: { opacity: 0.85 },
  payBtnText: { fontSize: 17, fontWeight: '700' as const, color: '#FFFFFF' },
  processingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  trustText: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  successContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 24, fontWeight: '800' as const, color: Colors.text, marginBottom: 8 },
  successAmount: { fontSize: 40, fontWeight: '800' as const, color: Colors.success, letterSpacing: -1 },
  successDesc: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  successMethodRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, backgroundColor: Colors.surfaceAlt, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  successMethodText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' as const },
  successBtn: {
    backgroundColor: Colors.customerPrimary,
    borderRadius: 14,
    paddingHorizontal: 48,
    paddingVertical: 16,
    marginTop: 32,
  },
  successBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '800' as const, color: Colors.text },
  modalBody: { flex: 1 },
  modalContent: { padding: 20 },
  cardFormSection: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary, marginBottom: 8 },
  formInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  formTextInput: { flex: 1, fontSize: 16, color: Colors.text },
  formRow: { flexDirection: 'row', gap: 12 },
  addCardSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.customerPrimary,
    borderRadius: 14,
    height: 54,
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  addCardSubmitText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  stripeCheckoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: STRIPE_PURPLE,
    borderRadius: 16,
    height: 58,
    gap: 8,
    marginBottom: 12,
  },
  stripeCheckoutBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
