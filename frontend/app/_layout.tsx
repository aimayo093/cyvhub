import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { JobsProvider } from "@/providers/JobsProvider";
import { DeliveriesProvider } from "@/providers/DeliveriesProvider";
import { CarrierProvider } from "@/providers/CarrierProvider";
import { PaymentProvider } from "@/providers/PaymentProvider";
import { LocationProvider } from "@/providers/LocationProvider";
import WebOnlyGate from "@/components/WebOnlyGate";
import Colors from "@/constants/colors";
import { CMSProvider } from "@/context/CMSContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { API_URL } from "@/services/api";

function validateEnvironment() {
    if (Platform.OS !== 'web') return true;

    const required = [
        { key: 'EXPO_PUBLIC_API_URL', value: API_URL }
    ];

    const missing = required.filter(item => !item.value || item.value === 'undefined');

    if (missing.length > 0) {
        console.error('MISSING ENVIRONMENT VARIABLES:', missing.map(m => m.key));
        return false;
    }
    return true;
}

if (typeof window !== 'undefined') {
    (window as any).__CYVHUB_DIAGNOSTIC__ = "APP_LOADED_V3";
}

// SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading, userRole, logout } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const isWebOnlyRole = Platform.OS !== 'web' && userRole === 'admin';

  // [DIAGNOSTIC] Track state transitions in production logs
  useEffect(() => {
    console.log('[RootLayoutNav] Status:', { isAuthenticated, isLoading, userRole, activeSegment: segments[0] });
  }, [isAuthenticated, isLoading, userRole, segments]);

  useEffect(() => {
    if (isLoading) return;

    const seg = segments[0] as string;
    console.log(`[RootLayoutNav] Routing guard evaluating segment: ${seg}`);

    const isPublicRoute = 
      seg === '(public)' || 
      seg === 'login' || 
      seg === 'verify-email-sent' ||
      seg === 'verify-email' ||
      seg === 'forgot-password' ||
      seg === 'reset-password' ||
      seg === 'terms' ||
      seg === 'privacy' ||
      seg === 'track';
      // NOTE: payment-checkout and checkout are intentionally NOT listed here —
      // they are authenticated screens. Listing them as public caused the auth guard
      // to redirect logged-in users back to /(tabs) whenever they navigated to payment.

    const isAdminRoute = seg === 'admin' || seg?.startsWith('admin-');

    if (!isAuthenticated) {
      if (Platform.OS !== 'web') {
        // Mobile platform: unauthenticated users go to login, except verification, legal, or password reset screens
        const isVerifyRoute = seg === 'verify-email-sent' || seg === 'verify-email';
        const isLegalRoute = seg === 'terms' || seg === 'privacy';
        const isPassResetRoute = seg === 'forgot-password' || seg === 'reset-password';
        if (seg !== 'login' && !isVerifyRoute && !isLegalRoute && !isPassResetRoute) {
           router.replace('/login' as any);
        }
      } else {
        // Web platform: 
        // 1. If on an admin route, stay there (it might be the admin login)
        if (isAdminRoute) return;

        // 2. Unauthenticated users on private routes go to public landing
        if (!isPublicRoute) {
          router.replace('/(public)' as any);
        }
      }
    } else if (isAuthenticated && (isPublicRoute || seg === 'admin')) {
      // Don't redirect away from legal pages if authenticated
      if (seg !== 'terms' && seg !== 'privacy') {
        router.replace('/(tabs)' as any);
      }
    }
  }, [isAuthenticated, isLoading, segments, router]);

  useEffect(() => {
    if (!isLoading) {
      // SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isAuthenticated && isWebOnlyRole) {
    return (
      <WebOnlyGate
        roleName="Admin"
        onLogout={logout}
      />
    );
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(public)" options={{ headerShown: false }} />
      <Stack.Screen
        name="login"
        options={{ headerShown: false, gestureEnabled: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="verify-email-sent"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="verify-email"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="reset-password"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="terms"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="privacy"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="job-detail"
        options={{
          title: "Job Details",
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="delivery-detail"
        options={{
          title: "Delivery Details",
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="book-delivery"
        options={{
          title: "Book a Delivery",
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          title: "Edit Profile",
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="support"
        options={{
          title: "Help & Support",
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="compliance-upload"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="admin-compliance"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="admin-compliance-detail"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="pod"
        options={{
          title: "Proof of Delivery",
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="company-profile"
        options={{
          title: "Company Profile",
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="user-management"
        options={{
          title: "Team Management",
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="customer-analytics"
        options={{
          title: "Analytics",
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="customer-ai"
        options={{
          title: "AI Assistant",
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="pod-viewer"
        options={{
          title: "Proof of Delivery",
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="carrier-profile"
        options={{
          title: "Company Profile",
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="carrier-rates"
        options={{
          title: "Rate Management",
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="carrier-analytics"
        options={{
          title: "Performance Analytics",
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="carrier-ai"
        options={{
          title: "AI Assistant",
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="payment-checkout"
        options={{
          title: "Payment",
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="payment-methods"
        options={{
          title: "Payment Methods",
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="track-delivery"
        options={{
          title: "Track Delivery",
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="admin-accounting"
        options={{
          title: "Accounting",
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="admin-notification-settings"
        options={{
          title: "Notification Settings",
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="checkout"
        options={{
          headerTitle: "Secure Checkout",
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="track"
        options={{
          headerTitle: "Track Delivery",
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          presentation: 'card',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  if (!validateEnvironment()) {
    return (
        <View style={{ flex: 1, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Configuration Error</Text>
            <Text style={{ textAlign: 'center', color: '#666' }}>
                The application is missing critical configuration. Please ensure all environment variables are set in Vercel.
            </Text>
        </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <CMSProvider>
            <AuthProvider>
              <LocationProvider>
                <JobsProvider>
                  <DeliveriesProvider>
                    <CarrierProvider>
                      <PaymentProvider>
                        <RootLayoutNav />
                      </PaymentProvider>
                    </CarrierProvider>
                  </DeliveriesProvider>
                </JobsProvider>
              </LocationProvider>
            </AuthProvider>
          </CMSProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
