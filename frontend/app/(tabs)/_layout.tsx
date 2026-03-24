import { Tabs, useRouter } from "expo-router";
import {
  LayoutDashboard,
  Briefcase,
  Wallet,
  User,
  Home,
  Package,
  Bell,
  Users,
  ClipboardList,
  Receipt,
  Shield,
  Navigation,
  BarChart3,
  FileText,
  Container,
  Truck,
  Building2,
  ScrollText,
  Leaf,
  Brain,
  MapPin,
  Menu,
  X,
  Edit,
  Globe,
  Calculator
} from "lucide-react-native";
import React, { useState, useCallback } from "react";
import {
  Platform,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Pressable,
  Image,
} from "react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SIDEBAR_WIDTH = 240;
const isWeb = Platform.OS === "web";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function TabLayout() {
  const { userRole, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const isDriver = userRole === "driver";
  const isCustomer = userRole === "customer";
  const isAdmin = userRole === "admin";
  const isCarrier = userRole === "carrier";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-SIDEBAR_WIDTH));

  const accent = isDriver
    ? Colors.primary
    : isAdmin
      ? Colors.adminPrimary
      : isCarrier
        ? Colors.carrierPrimary
        : Colors.customerPrimary;

  const toggleSidebar = useCallback(() => {
    const toValue = sidebarOpen ? -SIDEBAR_WIDTH : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start();
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen, slideAnim]);

  const closeSidebar = useCallback(() => {
    if (sidebarOpen) {
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: false,
      }).start();
      setSidebarOpen(false);
    }
  }, [sidebarOpen, slideAnim]);

  // Build the Tabs with hidden tabBar, the sidebar provides navigation
  return (
    <View style={styles.root}>
      {/* === MOBILE SIDEBAR OVERLAY === */}
      {!isWeb && sidebarOpen && (
        <Pressable style={styles.overlay} onPress={closeSidebar} />
      )}

      {/* === MOBILE SLIDE-OUT SIDEBAR === */}
      {!isWeb && (
        <Animated.View
          style={[
            styles.mobileSidebar,
            {
              transform: [{ translateX: slideAnim }],
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <SidebarContent
            accent={accent}
            userRole={userRole}
            isDriver={isDriver}
            isCustomer={isCustomer}
            isAdmin={isAdmin}
            isCarrier={isCarrier}
            onItemPress={closeSidebar}
            onLogout={logout}
          />
        </Animated.View>
      )}

      {/* === WEB PERSISTENT SIDEBAR === */}
      {isWeb && (
        <View style={[styles.webSidebar, { paddingTop: 16, paddingBottom: 16 }]}>
          <SidebarContent
            accent={accent}
            userRole={userRole}
            isDriver={isDriver}
            isCustomer={isCustomer}
            isAdmin={isAdmin}
            isCarrier={isCarrier}
            onItemPress={() => { }}
            onLogout={logout}
          />
        </View>
      )}

      {/* === MAIN CONTENT === */}
      <View style={styles.mainContent}>
        {/* Mobile hamburger header */}
        {!isWeb && (
          <View style={[styles.mobileHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              onPress={toggleSidebar}
              style={styles.hamburger}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {sidebarOpen ? (
                <X size={22} color={Colors.textInverse} />
              ) : (
                <Menu size={22} color={Colors.textInverse} />
              )}
            </TouchableOpacity>
            <Text style={styles.mobileHeaderTitle}>CYVhub</Text>
            <View style={{ width: 22 }} />
          </View>
        )}

        <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 1100 : undefined, alignSelf: 'center' }}>
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: accent,
              tabBarInactiveTintColor: Colors.textMuted,
              headerShown: false,
              tabBarStyle: { display: "none" },
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: isDriver ? "Dashboard" : isAdmin ? "Overview" : isCarrier ? "Dashboard" : "Home",
                tabBarIcon: ({ color, size }) =>
                  isCarrier
                    ? <LayoutDashboard color={color} size={size} />
                    : isAdmin
                      ? <LayoutDashboard color={color} size={size} />
                      : isDriver
                        ? <LayoutDashboard color={color} size={size} />
                        : <Home color={color} size={size} />,
              }}
            />
            <Tabs.Screen name="jobs" options={{ title: "Jobs", href: (isDriver || isCarrier) ? undefined : null }} />
            <Tabs.Screen name="earnings" options={{ title: isCarrier ? "Revenue" : "Earnings", href: (isDriver || isCarrier) ? undefined : null }} />
            <Tabs.Screen name="fleet" options={{ title: "Fleet", href: isCarrier ? undefined : null }} />
            <Tabs.Screen name="map" options={{ title: "Map", href: (isDriver || isCarrier) ? undefined : null }} />
            <Tabs.Screen name="deliveries" options={{ title: "Deliveries", href: isCustomer ? undefined : null }} />
            <Tabs.Screen name="customer-quotes" options={{ title: "Quotes", href: isCustomer ? undefined : null }} />
            <Tabs.Screen name="financials" options={{ title: "Financials", href: isCustomer ? undefined : null }} />
            <Tabs.Screen name="activity" options={{ title: "Activity", href: (isCustomer || isDriver) ? undefined : null }} />
            <Tabs.Screen name="dispatch" options={{ title: "Dispatch", href: isAdmin ? undefined : null }} />
            <Tabs.Screen name="tracking" options={{ title: "Tracking", href: isAdmin ? undefined : null }} />
            <Tabs.Screen name="manage-jobs" options={{ title: "All Jobs", href: isAdmin ? undefined : null }} />
            <Tabs.Screen name="carriers" options={{ title: "Carriers", href: isAdmin ? undefined : null }} />
            <Tabs.Screen name="businesses" options={{ title: "Businesses", href: isAdmin ? undefined : null }} />
            <Tabs.Screen name="contracts" options={{ title: "Contracts", href: isAdmin ? undefined : null }} />
            <Tabs.Screen name="quotes" options={{ title: "Quotes", href: isAdmin ? undefined : null }} />
            <Tabs.Screen name="invoices" options={{ title: "Invoices", href: isAdmin ? undefined : null }} />
            <Tabs.Screen name="tax" options={{ title: "Tax & VAT", href: isAdmin ? undefined : null }} />
            <Tabs.Screen name="analytics" options={{ title: "Analytics", href: isAdmin ? undefined : null }} />
            <Tabs.Screen name="sustainability" options={{ title: "Green", href: isAdmin ? undefined : null }} />
            <Tabs.Screen name="ai-panel" options={{ title: "AI", href: isAdmin ? undefined : null }} />
            <Tabs.Screen name="payments" options={{ title: "Payments", href: (isAdmin || isCustomer) ? undefined : null }} />
            <Tabs.Screen name="users" options={{ title: "Users", href: isAdmin ? undefined : null }} />
            <Tabs.Screen name="cms" options={{ title: "CMS", href: isAdmin ? undefined : null }} />
            <Tabs.Screen name="profile" options={{ title: isAdmin ? "Settings" : "Profile" }} />
          </Tabs>
        </View>
      </View>
    </View>
  );
}

/* ─── Sidebar Content Component ─── */

type SidebarMenuItem = {
  key: string;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  route: string;
  section?: string;
};

function SidebarContent({
  accent,
  userRole,
  isDriver,
  isCustomer,
  isAdmin,
  isCarrier,
  onItemPress,
  onLogout,
}: {
  accent: string;
  userRole: string | null;
  isDriver: boolean;
  isCustomer: boolean;
  isAdmin: boolean;
  isCarrier: boolean;
  onItemPress: () => void;
  onLogout: () => void;
}) {
  const router = useRouter();

  // Build menu items based on role
  const menuItems: SidebarMenuItem[] = [];

  // Home / Dashboard — always shown
  menuItems.push({
    key: "index",
    label: isDriver ? "Dashboard" : isAdmin ? "Overview" : isCarrier ? "Dashboard" : "Home",
    icon: isCustomer ? Home : LayoutDashboard,
    route: "/(tabs)",
    section: "Main",
  });

  // Driver / Carrier items
  if (isDriver || isCarrier) {
    menuItems.push({ key: "jobs", label: "Jobs", icon: Briefcase, route: "/(tabs)/jobs", section: "Main" });
    menuItems.push({ key: "earnings", label: isCarrier ? "Revenue" : "Earnings", icon: Wallet, route: "/(tabs)/earnings", section: "Main" });
    menuItems.push({ key: "map", label: "Map", icon: MapPin, route: "/(tabs)/map", section: "Main" });
  }

  if (isCarrier) {
    menuItems.push({ key: "fleet", label: "Fleet", icon: Truck, route: "/(tabs)/fleet", section: "Main" });
  }

  // Customer items
  if (isCustomer) {
    menuItems.push({ key: "deliveries", label: "Deliveries", icon: Package, route: "/(tabs)/deliveries", section: "Main" });
    menuItems.push({ key: "customer-quotes", label: "Quotes", icon: FileText, route: "/(tabs)/customer-quotes", section: "Main" });
    menuItems.push({ key: "financials", label: "Financials", icon: Receipt, route: "/(tabs)/financials", section: "Main" });
    menuItems.push({ key: "payments", label: "Payments", icon: Wallet, route: "/(tabs)/payments", section: "Main" });
  }

  // Activity (customer + driver)
  if (isCustomer || isDriver) {
    menuItems.push({ key: "activity", label: "Activity", icon: Bell, route: "/(tabs)/activity", section: "Main" });
  }

  // Admin items
  if (isAdmin) {
    menuItems.push({ key: "dispatch", label: "Dispatch", icon: Navigation, route: "/(tabs)/dispatch", section: "Management" });
    menuItems.push({ key: "tracking", label: "Tracking", icon: MapPin, route: "/(tabs)/tracking", section: "Management" });
    menuItems.push({ key: "manage-jobs", label: "All Jobs", icon: ClipboardList, route: "/(tabs)/manage-jobs", section: "Management" });
    menuItems.push({ key: "carriers", label: "Carriers", icon: Truck, route: "/(tabs)/carriers", section: "Management" });
    menuItems.push({ key: "businesses", label: "Businesses", icon: Building2, route: "/(tabs)/businesses", section: "Management" });
    menuItems.push({ key: "contracts", label: "Contracts", icon: ScrollText, route: "/(tabs)/contracts", section: "Management" });
    menuItems.push({ key: "quotes", label: "Quotes", icon: FileText, route: "/(tabs)/quotes", section: "Management" });
    menuItems.push({ key: "invoices", label: "Invoices", icon: Receipt, route: "/(tabs)/invoices", section: "Management" });
    menuItems.push({ key: "payments", label: "Payments", icon: Wallet, route: "/(tabs)/payments", section: "Finance" });
    menuItems.push({ key: "tax", label: "Tax & VAT", icon: Calculator, route: "/(tabs)/tax", section: "Finance" });
    menuItems.push({ key: "analytics", label: "Analytics", icon: BarChart3, route: "/(tabs)/analytics", section: "Insights" });
    menuItems.push({ key: "sustainability", label: "Green", icon: Leaf, route: "/(tabs)/sustainability", section: "Insights" });
    menuItems.push({ key: "ai-panel", label: "AI Panel", icon: Brain, route: "/(tabs)/ai-panel", section: "Insights" });
    menuItems.push({ key: "users", label: "Users", icon: Users, route: "/(tabs)/users", section: "Admin" });
    menuItems.push({ key: "cms", label: "Website CMS", icon: Globe, route: "/(tabs)/cms", section: "Admin" });
  }

  // Profile — always shown, at bottom
  menuItems.push({
    key: "profile",
    label: isAdmin ? "Settings" : "Profile",
    icon: isAdmin ? Shield : User,
    route: "/(tabs)/profile",
    section: "Account",
  });

  // Group by section
  const sections: { name: string; items: SidebarMenuItem[] }[] = [];
  menuItems.forEach((item) => {
    const sectionName = item.section ?? "Main";
    let section = sections.find((s) => s.name === sectionName);
    if (!section) {
      section = { name: sectionName, items: [] };
      sections.push(section);
    }
    section.items.push(item);
  });

  const roleLabel = isAdmin ? "Admin" : isCarrier ? "Carrier" : isDriver ? "Driver" : "Business";

  return (
    <View style={sidebarStyles.container}>
      {/* Logo / Brand */}
      <View style={sidebarStyles.brand}>
        <Image
          source={require("@/assets/images/logo-white-no-bg.png")}
          style={sidebarStyles.logo}
          resizeMode="contain"
        />
        <View style={[sidebarStyles.rolePill, { backgroundColor: accent + "25" }]}>
          <View style={[sidebarStyles.roleDot, { backgroundColor: accent }]} />
          <Text style={[sidebarStyles.roleText, { color: accent }]}>{roleLabel}</Text>
        </View>
      </View>

      {/* Navigation Items */}
      <ScrollView
        style={sidebarStyles.nav}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {sections.map((section, sIdx) => (
          <View key={section.name} style={sIdx > 0 ? sidebarStyles.sectionSpacing : undefined}>
            {sIdx > 0 && (
              <>
                <View style={sidebarStyles.divider} />
                <Text style={sidebarStyles.sectionLabel}>{section.name}</Text>
              </>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={sidebarStyles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    router.push(item.route as any);
                    onItemPress();
                  }}
                >
                  <Icon size={18} color={Colors.textMuted} />
                  <Text style={sidebarStyles.menuItemText}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Logout */}
      <TouchableOpacity style={sidebarStyles.logoutBtn} onPress={onLogout} activeOpacity={0.7}>
        <X size={16} color={Colors.danger} />
        <Text style={sidebarStyles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── Main Styles ─── */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: Colors.background,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 90,
  },
  mobileSidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: Colors.navy,
    zIndex: 100,
    paddingHorizontal: 16,
  },
  webSidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: Colors.navy,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: Colors.navyLight,
  },
  mainContent: {
    flex: 1,
  },
  mobileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.navy,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  hamburger: {
    padding: 4,
  },
  mobileHeaderTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.textInverse,
    letterSpacing: 0.5,
  },
});

/* ─── Sidebar Styles ─── */
const sidebarStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  brand: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyLight,
  },
  logo: {
    width: 130,
    height: 38,
    marginBottom: 10,
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "700" as const,
  },
  nav: {
    flex: 1,
  },
  sectionSpacing: {
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 12,
    marginBottom: 6,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.navyLight,
    marginVertical: 8,
    marginHorizontal: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#CBD5E1",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.navyLight,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.danger,
  },
});
