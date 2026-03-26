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

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading, userRole, logout } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const isWebOnlyRole = Platform.OS !== 'web' && userRole === 'admin';

  useEffect(() => {
    if (isLoading) return;

    const seg = segments[0] as string;

    const isPublicRoute = 
      seg === '(public)' || 
      seg === 'login' || 
      seg === 'admin' ||
      seg === 'verify-email-sent' ||
      seg === 'verify-email' ||
      seg === 'forgot-password' ||
      seg === 'reset-password' ||
      seg === 'terms' ||
      seg === 'privacy-policy';

    if (!isAuthenticated) {
      if (Platform.OS !== 'web') {
        // Mobile platform: unauthenticated users go to login, except verification, legal, or password reset screens
        const isVerifyRoute = seg === 'verify-email-sent' || seg === 'verify-email';
        const isLegalRoute = seg === 'terms' || seg === 'privacy-policy';
        const isPassResetRoute = seg === 'forgot-password' || seg === 'reset-password';
        if (seg !== 'login' && !isVerifyRoute && !isLegalRoute && !isPassResetRoute) {
           router.replace('/login' as any);
        }
      } else {
        // Web platform: unauthenticated users can browse public marketing routes
        if (!isPublicRoute) {
          router.replace('/(public)' as any);
        }
      }
    } else if (isAuthenticated && isPublicRoute) {
      // Don't redirect away from legal pages if authenticated
      if (seg !== 'terms' && seg !== 'privacy-policy') {
        router.replace('/(tabs)' as any);
      }
    }
  }, [isAuthenticated, isLoading, segments, router]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
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
        name="privacy-policy"
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
    </Stack>
  );
}

export default function RootLayout() {
  return (
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
  );
}
