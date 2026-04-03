import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  CreditCard,
  FileText,
  ChevronRight,
  ShieldCheck,
  Package,
  MapPin,
  ArrowRight,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';
import { usePayment } from '@/providers/PaymentProvider';

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { initiateStripeCheckout } = usePayment();

  const jobId = params.jobId as string;
  const jobNumber = params.jobNumber as string;
  const amount = parseFloat(params.amount as string || '0');
  const pickup = params.pickup as string;
  const dropoff = params.dropoff as string;

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'invoice'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePayment = async () => {
    setIsSubmitting(true);
    try {
      if (paymentMethod === 'card') {
        // Use the existing Stripe flow
        await initiateStripeCheckout(amount, `Delivery ${jobNumber}`, jobId);
        // Note: Success is handled by the PaymentProvider/Stripe SDK
      } else {
        // Use the new Invoice flow
        const response = await apiClient('/checkout/invoice', {
          method: 'POST',
          body: JSON.stringify({ jobId }),
        });

        if (response && response.data) {
          Alert.alert(
            'Success',
            'Order placed successfully. An invoice has been sent to your registered business email.',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)/history') }]
          );
        }
      }
    } catch (error: any) {
      console.error('Checkout failed:', error);
      Alert.alert('Error', error.message || 'Checkout failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Secure Checkout',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: '#fff',
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
             <View style={styles.summaryIcon}>
                <Package size={20} color={Colors.customerPrimary} />
             </View>
             <View style={{ flex: 1 }}>
                <Text style={styles.summaryLabel}>Job Reference</Text>
                <Text style={styles.summaryValue}>{jobNumber}</Text>
             </View>
          </View>

          <View style={styles.routeContainer}>
             <View style={styles.addressLine}>
                <MapPin size={14} color={Colors.success} />
                <Text style={styles.addressText} numberOfLines={1}>{pickup}</Text>
             </View>
             <View style={styles.connector} />
             <View style={styles.addressLine}>
                <MapPin size={14} color={Colors.danger} />
                <Text style={styles.addressText} numberOfLines={1}>{dropoff}</Text>
             </View>
          </View>

          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
             <Text style={styles.totalLabel}>Total Payable (inc. VAT)</Text>
             <Text style={styles.totalValue}>£{(amount * 1.2).toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          
          <TouchableOpacity 
            style={[styles.methodCard, paymentMethod === 'card' && styles.methodCardActive]}
            onPress={() => setPaymentMethod('card')}
            activeOpacity={0.7}
          >
            <View style={[styles.radio, paymentMethod === 'card' && styles.radioActive]}>
                {paymentMethod === 'card' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.methodIcon}>
               <CreditCard size={24} color={paymentMethod === 'card' ? Colors.customerPrimary : Colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
               <Text style={styles.methodName}>Credit / Debit Card</Text>
               <Text style={styles.methodDesc}>Secure payment via Stripe</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.methodCard, paymentMethod === 'invoice' && styles.methodCardActive]}
            onPress={() => setPaymentMethod('invoice')}
            activeOpacity={0.7}
          >
            <View style={[styles.radio, paymentMethod === 'invoice' && styles.radioActive]}>
                {paymentMethod === 'invoice' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.methodIcon}>
               <FileText size={24} color={paymentMethod === 'invoice' ? Colors.customerPrimary : Colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
               <Text style={styles.methodName}>Business Invoice</Text>
               <Text style={styles.methodDesc}>Pay via bank transfer (30-day terms)</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.trustBanner}>
           <ShieldCheck size={16} color={Colors.success} />
           <Text style={styles.trustText}>Payments are encrypted and secure.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handlePayment}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>
                {paymentMethod === 'card' ? 'Pay with Card' : 'Place Booking on Invoice'}
              </Text>
              <ChevronRight size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a2540',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.customerPrimary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  routeContainer: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  addressLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  connector: {
    width: 2,
    height: 12,
    backgroundColor: Colors.border,
    marginLeft: 6,
    marginVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.customerPrimary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  methodCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  methodCardActive: {
    borderColor: Colors.customerPrimary,
    backgroundColor: Colors.customerPrimary + '05',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: Colors.customerPrimary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.customerPrimary,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  methodDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  trustText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitButton: {
    backgroundColor: Colors.customerPrimary,
    borderRadius: 14,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
