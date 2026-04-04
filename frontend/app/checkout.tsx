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
  Modal,
  ScrollView,
  Linking,
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
type CheckoutStatus = 'loading' | 'ready' | 'booking_not_found' | 'error';

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { initiateStripeCheckout, initiatePaypalCheckout, capturePaypalOrder } = usePayments();
  const { customer, userRole } = useAuth();

  const [status, setStatus] = useState<CheckoutStatus>('loading');
  const [job, setJob] = useState<Delivery | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const jobId = params.jobId as string;
  const paymentStatus = params.status as string;

  // Handle successful payment redirection
  useEffect(() => {
    if (paymentStatus === 'success' && jobId) {
      if (params.orderId) {
        // PayPal redirect - capture order on backend
        handlePaypalCapture(params.orderId as string, jobId);
      } else {
        // Stripe or other provider - show success
        setIsSuccess(true);
        setTimeout(() => {
          router.replace('/(tabs)/history' as any);
        }, 3000);
      }
    } else if (paymentStatus === 'canceled' || paymentStatus === 'cancel') {
      Alert.alert('Payment Cancelled', 'You have cancelled the payment process. You can try again or choose another method.');
    }
  }, [paymentStatus, jobId, params.orderId]);

  const handlePaypalCapture = async (orderId: string, id: string) => {
    setIsSubmitting(true);
    try {
      console.log(`[Checkout] Capturing PayPal order ${orderId} for job ${id}`);
      const response = await capturePaypalOrder(orderId, id);
      if (response.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.replace('/(tabs)/history' as any);
        }, 3000);
      }
    } catch (error: any) {
      console.error('[Checkout] PayPal capture failed:', error);
      Alert.alert('Payment Error', 'Your payment was approved by PayPal but we could not finalize the booking on our end. Please contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hydrate full job data to fix "Unknown" fields
  const fetchJobDetails = useCallback(async () => {
    if (!jobId) {
      console.error('[Checkout] No jobId found in params.');
      setStatus('booking_not_found');
      return;
    }
    
    setStatus('loading');
    try {
      console.log(`[Checkout] Fetching job details for: ${jobId}`);
      const response = await apiClient(`/deliveries/${jobId}`);
      
      if (response && response.data) {
        console.log('[Checkout] Job data retrieved successfully:', response.data.jobNumber);
        setJob(response.data);
        setStatus('ready');
      } else {
        console.error('[Checkout] Job data empty or invalid format:', response);
        // If we have jobId but couldn't get data, try fallback to URL params
        if (params.jobNumber) {
          useFallbackData();
        } else {
          setStatus('booking_not_found');
        }
      }
    } catch (error: any) {
      console.error('[Checkout] API call failed:', error?.message || error);
      
      // For guest users, the /api/deliveries/:id call might fail with 401/403
      // We fall back to the URL parameters so the user can still pay.
      if (params.jobNumber) {
        console.warn('[Checkout] Using URL params as fallback for job data.');
        useFallbackData();
      } else {
        setErrorDetails(error?.message || 'Connection failed');
        setStatus('error');
      }
    }
  }, [jobId]);

  const useFallbackData = () => {
    setJob({
      id: jobId,
      jobNumber: (params.jobNumber as string) || 'N/A',
      status: 'PENDING_PAYMENT',
      calculatedPrice: parseFloat(params.amount as string || '0'),
      pickupCity: (params.pickup as string) || 'Collection',
      dropoffCity: (params.dropoff as string) || 'Delivery',
      vehicleType: (params.vehicleType as string) || 'Van',
      jobType: (params.serviceType as string) || 'Standard',
    } as any);
    setStatus('ready');
  };

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  const isBusinessUser = userRole === 'customer' && customer?.businessAccountId != null;
  const displayAmount = job?.calculatedPrice || parseFloat(params.amount as string || '0');
  const totalAmount = displayAmount * 1.2; // Including VAT

  const getButtonLabel = () => {
    if (isSubmitting) {
      if (paymentMethod === 'card') return 'Processing Card...';
      if (paymentMethod === 'paypal') return 'Redirecting to PayPal...';
      if (paymentMethod === 'stripe') return 'Opening Stripe Checkout...';
      return 'Processing...';
    }
    const amountStr = totalAmount.toFixed(2);
    if (paymentMethod === 'invoice') return 'Confirm Booking';
    if (paymentMethod === 'paypal') return `Pay £${amountStr} with PayPal`;
    if (paymentMethod === 'stripe') return `Pay £${amountStr} with Stripe`;
    return `Pay £${amountStr} Now`;
  };

  const handlePayment = async () => {
    setIsSubmitting(true);
    try {
      console.log(`[Checkout] Processing payment via: ${paymentMethod}`);
      
      if (paymentMethod === 'card') {
        // useHostedSession = false for inline card flow (Future: Stripe Elements)
        await initiateStripeCheckout(displayAmount, `Delivery ${job?.jobNumber || 'Booking'}`, jobId, false);
      } else if (paymentMethod === 'paypal') {
        const { approvalUrl } = await initiatePaypalCheckout(displayAmount, `Delivery ${job?.jobNumber || 'Booking'}`, jobId);
        if (approvalUrl) {
          console.log(`[Checkout] Success: Redirecting to PayPal: ${approvalUrl}`);
          if (Platform.OS === 'web') {
            window.location.href = approvalUrl;
          } else {
            await Linking.openURL(approvalUrl);
          }
        } else {
          throw new Error('Could not initialize PayPal checkout. Please try another method.');
        }
      } else if (paymentMethod === 'stripe') {
        // useHostedSession = true for Stripe-hosted payment page
        await initiateStripeCheckout(displayAmount, `Delivery ${job?.jobNumber || 'Booking'}`, jobId, true);
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
      console.error('[Checkout] Payment failed:', error);
      Alert.alert('Checkout Error', error.message || 'Payment could not be initialized. Please check your connection and try again.');
      setIsSubmitting(false); // Reset immediately on error
    } finally {
      // NOTE: For redirections (PayPal/Stripe Checkout), we don't reset isSubmitting
      // because we want the spinner to stay until the page actually redirects/unmounts.
      // If it fails before redirect, the catch block handles it.
      if (paymentMethod === 'card' || paymentMethod === 'invoice') {
        setIsSubmitting(false);
      }
    }
  };

  if (isSuccess) {
    return (
      <ResponsiveContainer>
        <Stack.Screen options={{ title: 'Payment Successful' }} />
        <View style={styles.successContainer}>
          <View style={styles.successIconWrapper}>
            <CheckCircle2 size={64} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Payment Received!</Text>
          <Text style={styles.successSubtitle}>Thank you for your booking.</Text>
          <Text style={styles.successDesc}>
            Your delivery for <Text style={{ fontWeight: '700' }}>#{job?.jobNumber || 'N/A'}</Text> has been confirmed.
            Our team is now assigning a professional driver to your request.
          </Text>
          <View style={styles.successDetails}>
            <ActivityIndicator size="small" color={Colors.customerPrimary} />
            <Text style={styles.redirectText}>Redirecting to your dashboard...</Text>
          </View>
        </View>
      </ResponsiveContainer>
    );
  }

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.customerPrimary} />
        <Text style={{ marginTop: 12, color: Colors.textMuted }}>Initializing secure checkout...</Text>
      </View>
    );
  }

  if (status === 'booking_not_found' || !job) {
    return (
      <ResponsiveContainer>
        <Stack.Screen options={{ title: 'Secure Checkout' }} />
        <View style={styles.errorContainer}>
          <Package size={48} color={Colors.danger} />
          <Text style={styles.errorTitle}>Booking Not Found</Text>
          <Text style={styles.errorDesc}>We couldn't retrieve your booking details. This might be due to an expired session or an invalid link.</Text>
          
          <View style={styles.errorActions}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retryButton} onPress={fetchJobDetails}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ResponsiveContainer>
    );
  }

  if (status === 'error') {
    return (
      <ResponsiveContainer>
        <Stack.Screen options={{ title: 'Secure Checkout' }} />
        <View style={styles.errorContainer}>
          <Info size={48} color={Colors.danger} />
          <Text style={styles.errorTitle}>Checkout Error</Text>
          <Text style={styles.errorDesc}>{errorDetails || 'Something went wrong while loading checkout. Please try again.'}</Text>
          
          <View style={styles.errorActions}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retryButton} onPress={fetchJobDetails}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
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
              {getButtonLabel()}
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
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    color: Colors.text,
    fontWeight: '700',
  },
  retryButton: {
    backgroundColor: Colors.customerPrimary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  successContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  successIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.customerPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: Colors.customerPrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.navy,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.customerPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  successDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  redirectText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
});
