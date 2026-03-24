import React, { useState, useCallback } from 'react';
import { Linking, Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import {
  PaymentTransaction,
  PayoutRecord,
  PaymentSummary,
  PaymentCard,
  PayPalAccount,
  PaymentMethod,
  PaymentStatus,
  PayoutStatus,
  SettlementBatch,
  AccountingEntry,
} from '@/types';
import { apiClient } from '@/services/api';
import { useAuth } from './AuthProvider';

// B2-FE-1: Stripe publishable key read from environment — never hardcoded
// Set EXPO_PUBLIC_STRIPE_KEY in your .env file
const STRIPE_CONFIG = {
  publishableKey: process.env.EXPO_PUBLIC_STRIPE_KEY || '',
  checkoutBaseUrl: 'https://checkout.stripe.com/c/pay',
  successUrl: 'cyvhub://payment-success',
  cancelUrl: 'cyvhub://payment-cancel',
};

export const [PaymentProvider, usePayments] = createContextHook(() => {
  const { isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]); // Future DB table
  const [summary] = useState<PaymentSummary>({
    totalRevenue: 0,
    totalPayouts: 0,
    platformFees: 0,
    pendingPayments: 0,
    pendingPayouts: 0,
    stripeBalance: 0,
    paypalBalance: 0,
    monthlyRevenue: []
  });
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [paypalAccounts, setPaypalAccounts] = useState<PayPalAccount[]>([]);
  const [settlements, setSettlements] = useState<SettlementBatch[]>([]);
  const [accountingLedger, setAccountingLedger] = useState<AccountingEntry[]>([]);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);

  const loadPaymentData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [txnRes, ledgerRes, stlRes] = await Promise.all([
        apiClient('/payments/transactions'),
        apiClient('/payments/ledger'),
        apiClient('/payments/settlements')
      ]);
      setTransactions(txnRes.transactions || txnRes.data?.transactions || []);
      setAccountingLedger(ledgerRes.ledger || ledgerRes.data?.ledger || []);
      setSettlements(stlRes.settlements || stlRes.data?.settlements || []);
    } catch (e) {
      console.error('Failed to load payment data:', e);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  // ──────────────────────────────────────────────
  // STRIPE CHECKOUT FLOW
  // ──────────────────────────────────────────────

  /**
   * Initiates a Stripe Checkout session.
   * In demo mode, simulates the checkout flow with a mock session.
   * In production, would call your backend to create a Stripe Checkout Session
   * and open the returned URL via expo-web-browser or Linking.
   */
  const initiateStripeCheckout = useCallback(async (
    amount: number,
    description: string,
    deliveryId?: string,
    trackingNumber?: string,
  ): Promise<{ sessionId: string; transaction: PaymentTransaction }> => {
    try {
      // 1. Call the real backend endpoint to strictly create a PaymentIntent
      const response = await apiClient('/stripe/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify({ amount, description, deliveryId, trackingNumber })
      });

      const clientSecret = response.clientSecret || response.data?.clientSecret;
      const paymentIntentId = response.paymentIntentId || response.data?.paymentIntentId;

      // Create a pending transaction locally for the UI optimistic update
      const transaction: PaymentTransaction = {
        id: `txn-${Date.now()}`,
        type: 'charge',
        status: 'PENDING',
        amount,
        currency: 'GBP',
        method: 'stripe',
        description,
        deliveryId,
        trackingNumber,
        // B2-FE-2: Customer name resolved server-side — not stored client-side
        stripePaymentId: paymentIntentId || `pi_mock_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      setTransactions(prev => [transaction, ...prev]);
      setCheckoutSessionId(clientSecret);

      // In a production Expo app, you would use @stripe/stripe-react-native's initPaymentSheet 
      // here with the clientSecret. For this demo, we simulate opening the secure sheet:
      if (Platform.OS === 'web') {
        console.log(`Redirecting to Stripe with Client Secret: ${clientSecret}`);
      } else {
        console.log(`Opening Stripe Payment Sheet with Client Secret: ${clientSecret}`);
      }

      return { sessionId: clientSecret, transaction };
    } catch (e) {
      console.error('Failed to create PaymentIntent:', e);
      throw e;
    }
  }, []);

  const handlePaymentReturn = useCallback(async (
    url: string,
  ): Promise<{ success: boolean; transactionId?: string }> => {
    const isSuccess = url.includes('payment-success') || url.includes('success');

    if (isSuccess && checkoutSessionId) {
      // Update the pending transaction to completed
      setTransactions(prev => prev.map(t =>
        t.stripePaymentId === `pi_${checkoutSessionId}`
          ? { ...t, status: 'COMPLETED' as PaymentStatus, completedAt: new Date().toISOString() }
          : t
      ));

      const txn = transactions.find(t => t.stripePaymentId === `pi_${checkoutSessionId}`);
      setCheckoutSessionId(null);
      return { success: true, transactionId: txn?.id };
    }

    // Payment was cancelled
    setTransactions(prev => prev.map(t =>
      t.stripePaymentId === `pi_${checkoutSessionId}`
        ? { ...t, status: 'FAILED' as PaymentStatus }
        : t
    ));
    setCheckoutSessionId(null);
    return { success: false };
  }, [checkoutSessionId, transactions]);

  const getPaymentStatus = useCallback(async (
    transactionId: string,
  ): Promise<{ status: PaymentStatus; transaction?: PaymentTransaction }> => {
    const txn = transactions.find(t => t.id === transactionId);
    if (!txn) return { status: 'FAILED' };
    return { status: txn.status, transaction: txn };
  }, [transactions]);

  // ──────────────────────────────────────────────
  // STANDARD PAYMENT PROCESSING (existing)
  // ──────────────────────────────────────────────

  const processPayment = useCallback(async (
    amount: number,
    method: PaymentMethod,
    description: string,
    deliveryId?: string,
    trackingNumber?: string,
  ): Promise<PaymentTransaction> => {
    try {
      const response = await apiClient('/payments/charge', {
        method: 'POST',
        body: JSON.stringify({ amount, method, description, deliveryId, trackingNumber })
      });
      const completed = response.data.transaction;
      // Refresh local state rather than piecing it together
      loadPaymentData();
      return completed;
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  }, [loadPaymentData]);

  const processRefund = useCallback(async (transactionId: string, amount?: number): Promise<boolean> => {
    try {
      await apiClient('/payments/refund', {
        method: 'POST',
        body: JSON.stringify({ transactionId, amount })
      });
      loadPaymentData();
      return true;
    } catch (e) {
      console.error('Refund failed:', e);
      return false;
    }
  }, [loadPaymentData]);

  // ──────────────────────────────────────────────
  // PAYOUT MANAGEMENT
  // ──────────────────────────────────────────────

  const processPayout = useCallback(async (payoutId: string): Promise<boolean> => {
    setPayouts(prev => prev.map(p =>
      p.id === payoutId ? { ...p, status: 'PROCESSING' as PayoutStatus } : p
    ));

    await new Promise(resolve => setTimeout(resolve, 2000));

    const payout = payouts.find(p => p.id === payoutId);
    if (payout) {
      const ledgerEntry: AccountingEntry = {
        id: `acc-po-${Date.now()}`,
        type: 'debit',
        category: 'driver_payout',
        amount: payout.amount,
        description: `Payout to ${payout.recipientName}`,
        date: new Date().toISOString(),
        reference: payoutId,
        balance: 0,
      };
      setAccountingLedger(prev => [ledgerEntry, ...prev]);
    }

    setPayouts(prev => prev.map(p =>
      p.id === payoutId ? { ...p, status: 'PAID' as PayoutStatus, paidAt: new Date().toISOString() } : p
    ));
    return true;
  }, [payouts]);

  const holdPayout = useCallback((payoutId: string) => {
    setPayouts(prev => prev.map(p =>
      p.id === payoutId ? { ...p, status: 'ON_HOLD' as PayoutStatus } : p
    ));
  }, []);

  const releasePayout = useCallback((payoutId: string) => {
    setPayouts(prev => prev.map(p =>
      p.id === payoutId ? { ...p, status: 'PENDING' as PayoutStatus } : p
    ));
  }, []);

  // ──────────────────────────────────────────────
  // SETTLEMENT MANAGEMENT
  // ──────────────────────────────────────────────

  const createSettlement = useCallback((
    recipientId: string,
    recipientName: string,
    recipientType: 'driver' | 'carrier',
    grossAmount: number,
    deductions: SettlementBatch['deductions'],
    jobIds: string[],
    periodStart: string,
    periodEnd: string,
  ): SettlementBatch => {
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const netAmount = grossAmount - totalDeductions;

    const settlement: SettlementBatch = {
      id: `stl-${Date.now()}`,
      recipientId,
      recipientName,
      recipientType,
      status: 'PENDING_APPROVAL',
      periodStart,
      periodEnd,
      jobIds,
      jobsCount: jobIds.length,
      grossAmount,
      deductions,
      totalDeductions,
      netAmount,
      method: 'stripe',
      reference: `REF-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setSettlements(prev => [settlement, ...prev]);
    return settlement;
  }, []);

  const approveSettlement = useCallback((settlementId: string) => {
    setSettlements(prev => prev.map(s =>
      s.id === settlementId ? { ...s, status: 'APPROVED' as SettlementBatch['status'] } : s
    ));
  }, []);

  const processSettlementBatch = useCallback(async (settlementIds: string[]): Promise<boolean> => {
    try {
      for (const id of settlementIds) {
        await apiClient(`/payments/settlements/${id}/process`, { method: 'POST' });
      }
      loadPaymentData();
      return true;
    } catch (e) {
      console.error('Settlement processing failed:', e);
      return false;
    }
  }, [loadPaymentData]);

  const generateSettlementReport = useCallback((settlementId: string): {
    settlement: SettlementBatch | undefined;
    relatedLedgerEntries: AccountingEntry[];
  } => {
    const settlement = settlements.find(s => s.id === settlementId);
    const relatedLedgerEntries = accountingLedger.filter(e => e.reference === settlementId);
    return { settlement, relatedLedgerEntries };
  }, [settlements, accountingLedger]);

  // ──────────────────────────────────────────────
  // CARD / PAYPAL MANAGEMENT
  // ──────────────────────────────────────────────

  const addCard = useCallback((card: Omit<PaymentCard, 'id'>) => {
    const newCard: PaymentCard = { ...card, id: `card-${Date.now()}` };
    if (newCard.isDefault) {
      setCards(prev => prev.map(c => ({ ...c, isDefault: false })));
    }
    setCards(prev => [...prev, newCard]);
  }, []);

  const removeCard = useCallback((cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
  }, []);

  const setDefaultCard = useCallback((cardId: string) => {
    setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === cardId })));
    setPaypalAccounts(prev => prev.map(p => ({ ...p, isDefault: false })));
  }, []);

  const addPaypalAccount = useCallback((email: string) => {
    const account: PayPalAccount = { id: `pp-${Date.now()}`, email, isDefault: false };
    setPaypalAccounts(prev => [...prev, account]);
  }, []);

  const setDefaultPaypal = useCallback((accountId: string) => {
    setPaypalAccounts(prev => prev.map(p => ({ ...p, isDefault: p.id === accountId })));
    setCards(prev => prev.map(c => ({ ...c, isDefault: false })));
  }, []);

  const removePaypalAccount = useCallback((accountId: string) => {
    setPaypalAccounts(prev => prev.filter(p => p.id !== accountId));
  }, []);

  return {
    // Data
    transactions,
    payouts,
    summary,
    cards,
    paypalAccounts,
    settlements,
    accountingLedger,
    checkoutSessionId,
    // Stripe Checkout
    initiateStripeCheckout,
    handlePaymentReturn,
    getPaymentStatus,
    // Standard payments
    processPayment,
    processRefund,
    // Payouts
    processPayout,
    holdPayout,
    releasePayout,
    // Settlements
    createSettlement,
    approveSettlement,
    processSettlementBatch,
    generateSettlementReport,
    // Card/PayPal management
    addCard,
    removeCard,
    setDefaultCard,
    addPaypalAccount,
    setDefaultPaypal,
    removePaypalAccount,
  };
});

