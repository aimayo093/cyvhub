import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  CreditCard,
  FileText,
  ChevronRight,
  ShieldCheck,
  Package,
  MapPin,
  Info,
  CheckCircle2,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';
import { usePayments } from '@/providers/PaymentProvider';
import { useAuth } from '@/providers/AuthProvider';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { Delivery } from '@/types';

type PaymentMethodType = 'card' | 'paypal' | 'stripe' | 'invoice';

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { initiateStripeCheckout, initiatePaypalCheckout } = usePayments();
  const { customer, userRole } = useAuth();

  const [job, setJob] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const jobId = params.jobId as string;

  // Hydrate full job data to fix "Unknown" fields
  const fetchJobDetails = useCallback(async () => {
    if (!jobId) return;
    try {
      const response = await apiClient(`/deliveries/${jobId}`);
      if (response && response.data) {
        setJob(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  const isBusinessUser = userRole === 'customer' && customer?.businessAccountId != null;
  const displayAmount = job?.calculatedPrice || parseFloat(params.amount as string || '0');
  const totalAmount = displayAmount * 1.2; // Including VAT

  const handlePayment = async () => {
    setIsSubmitting(true);
    try {
      if (paymentMethod === 'card') {
        await initiateStripeCheckout(displayAmount, `Delivery ${job?.jobNumber || 'Booking'}`, jobId);
      } else if (paymentMethod === 'paypal') {
        const { approvalUrl } = await initiatePaypalCheckout(displayAmount, `Delivery ${job?.jobNumber || 'Booking'}`, jobId);
        if (approvalUrl) {
          Alert.alert('Redirecting', 'Opening PayPal secure payment gate...', [
            { text: 'OK', onPress: () => console.log('Opening PayPal...') }
          ]);
        }
      } else if (paymentMethod === 'stripe') {
        // Direct Stripe Hosted Checkout
        await initiateStripeCheckout(displayAmount, `Delivery ${job?.jobNumber || 'Booking'}`, jobId);
      } else if (paymentMethod === 'invoice') {
        const response = await apiClient('/checkout/invoice', {
          method: 'POST',
          body: JSON.stringify({ jobId }),
        });
        if (response && response.data) {
          router.replace({ pathname: '/(tabs)/history' as any });
        }
      }
    } catch (error: any) {
      Alert.alert('Checkout Error', error.message || 'Payment could not be initialized.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.customerPrimary} />
      </View>
    );
  }

  if (!job) {
    return (
      <ResponsiveContainer>
        <View style={styles.errorContainer}>
          <Package size={48} color={Colors.danger} />
          <Text style={styles.errorTitle}>Booking Not Found</Text>
          <Text style={styles.errorDesc}>We couldn't retrieve your booking details. Please try again.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer backgroundColor={Colors.background}>
      <Stack.Screen options={{ title: 'Secure Checkout', headerTitleAlign: 'center' }} />

      {/* Order Summary Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Package size={20} color={Colors.customerPrimary} />
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{job.jobNumber}</Text>
          </View>
        </View>

        <View style={styles.routeBox}>
          <View style={styles.routeItem}>
            <MapPin size={16} color={Colors.success} />
            <View>
              <Text style={styles.routeLabel}>Collection</Text>
              <Text style={styles.routeValue}>{job.pickupCity || 'Unknown City'}</Text>
            </View>
          </View>
          <View style={styles.routeConnector} />
          <View style={styles.routeItem}>
            <MapPin size={16} color={Colors.danger} />
            <View>
              <Text style={styles.routeLabel}>Delivery</Text>
              <Text style={styles.routeValue}>{job.dropoffCity || 'Unknown City'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Vehicle</Text>
            <Text style={styles.detailValue}>{job.vehicleType || 'Any'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>{job.jobType || 'Standard'}</Text>
          </View>
        </View>

        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>£{displayAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>VAT (20%)</Text>
            <Text style={styles.priceValue}>£{(displayAmount * 0.2).toFixed(2)}</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>£{totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Payment Methods */}
      <Text style={styles.sectionTitle}>Select Payment Method</Text>

      <View style={styles.methodsList}>
        <PaymentMethodOption
          id="card"
          title="Add / Pay with Card"
          description="Secure payment via Stripe"
          icon={<CreditCard size={24} color={paymentMethod === 'card' ? Colors.customerPrimary : Colors.textMuted} />}
          selected={paymentMethod === 'card'}
          onSelect={() => setPaymentMethod('card')}
        />

        <PaymentMethodOption
          id="paypal"
          title="PayPal"
          description="Pay via your PayPal account"
          icon={<Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/174/174861.png' }} style={{ width: 24, height: 24 }} />}
          selected={paymentMethod === 'paypal'}
          onSelect={() => setPaymentMethod('paypal')}
        />

        <PaymentMethodOption
          id="stripe"
          title="Stripe Direct"
          description="One-click checkout with Stripe"
          icon={<Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/5968/5968560.png' }} style={{ width: 24, height: 24 }} />}
          selected={paymentMethod === 'stripe'}
          onSelect={() => setPaymentMethod('stripe')}
        />

        {isBusinessUser && (
          <PaymentMethodOption
            id="invoice"
            title="Business Invoice"
            description="30-day payment terms"
            icon={<FileText size={24} color={paymentMethod === 'invoice' ? Colors.customerPrimary : Colors.textMuted} />}
            selected={paymentMethod === 'invoice'}
            onSelect={() => setPaymentMethod('invoice')}
          />
        )}
      </View>

      <View style={styles.securityNote}>
        <ShieldCheck size={16} color={Colors.success} />
        <Text style={styles.securityText}>All transactions are encrypted and secure.</Text>
      </View>

      <TouchableOpacity 
        style={[styles.payButton, isSubmitting && styles.payButtonDisabled]} 
        onPress={handlePayment}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.payButtonText}>
              {paymentMethod === 'invoice' ? 'Confirm Booking' : `Pay £${totalAmount.toFixed(2)} Now`}
            </Text>
            <ChevronRight size={20} color="#fff" />
          </>
        )}
      </TouchableOpacity>
    </ResponsiveContainer>
  );
}

function PaymentMethodOption({ id, title, description, icon, selected, onSelect }: any) {
  return (
    <TouchableOpacity 
      style={[styles.methodItem, selected && styles.methodItemSelected]} 
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.methodIconBox}>
        {icon}
      </View>
      <View style={styles.methodInfo}>
        <Text style={styles.methodTitle}>{title}</Text>
        <Text style={styles.methodDescription}>{description}</Text>
      </View>
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && <CheckCircle2 size={16} color={Colors.customerPrimary} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.navy,
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.customerPrimary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: Colors.customerPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  routeBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  routeConnector: {
    width: 2,
    height: 16,
    backgroundColor: Colors.border,
    marginLeft: 7,
    marginVertical: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.navy,
  },
  priceSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.navy,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.customerPrimary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  methodsList: {
    gap: 12,
    marginBottom: 24,
  },
  methodItem: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodItemSelected: {
    borderColor: Colors.customerPrimary,
    backgroundColor: Colors.customerPrimary + '05',
  },
  methodIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.navy,
  },
  methodDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: Colors.customerPrimary,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    opacity: 0.7,
  },
  securityText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  payButton: {
    backgroundColor: Colors.customerPrimary,
    borderRadius: 16,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: Colors.customerPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 40,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.navy,
    marginTop: 24,
  },
  errorDesc: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: Colors.customerPrimary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
