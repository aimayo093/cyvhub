import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Mail,
  Phone,
  CreditCard,
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  LogOut,
  ChevronRight,
  Star,
  FileText,
  HelpCircle,
  MapPin,
  Package,
  Edit3,
  Building2,
  Users,
  BarChart3,
  Brain,
  Receipt,
  Upload,
  RefreshCw,
  AlertCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/services/api';

const REQUIRED_DOC_TYPES = [
  { slug: 'driving_licence',       label: 'Driving Licence' },
  { slug: 'motor_insurance',       label: 'Motor Insurance' },
  { slug: 'mot_certificate',       label: 'MOT Certificate' },
  { slug: 'goods_in_transit',      label: 'Goods in Transit Insurance' },
  { slug: 'public_liability',      label: 'Public Liability Insurance' },
  { slug: 'right_to_work',         label: 'Right to Work' },
  { slug: 'vehicle_registration',  label: 'Vehicle Registration (V5)' },
];

const MOCK_CARRIER_COMPLIANCE = [
  { id: '1', type: 'Operator Licence', status: 'VALID', expiryDate: '2027-05-12' },
  { id: '2', type: 'Fleet Insurance', status: 'VALID', expiryDate: '2025-02-28' },
  { id: '3', type: 'Goods in Transit (£100k)', status: 'EXPIRING_SOON', expiryDate: '2024-04-15' },
  { id: '4', type: 'Public Liability (£5M)', status: 'VALID', expiryDate: '2025-08-30' },
  { id: '5', type: 'Employer Liability', status: 'VALID', expiryDate: '2025-08-30' },
];

function getComplianceIcon(status: string) {
  switch (status) {
    case 'VALID':
    case 'verified': return { Icon: CheckCircle, color: Colors.success };
    case 'EXPIRING_SOON':
    case 'expired': return { Icon: AlertTriangle, color: Colors.warning };
    case 'EXPIRED':
    case 'rejected': return { Icon: XCircle, color: Colors.danger };
    case 'pending_review': return { Icon: Clock, color: Colors.warning };
    default: return { Icon: AlertCircle, color: Colors.textMuted };
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'verified': return 'Verified';
    case 'pending_review': return 'Pending Review';
    case 'rejected': return 'Rejected';
    case 'expired': return 'Expired';
    default: return 'Not Submitted';
  }
}

function getOverallBadge(status: string): { label: string; bg: string; text: string } {
  switch (status) {
    case 'verified':      return { label: '✓ Fully Verified',        bg: Colors.successLight, text: Colors.success };
    case 'pending_verification': return { label: '⏳ Under Review',  bg: Colors.warningLight, text: Colors.warning };
    case 'rejected':      return { label: '✗ Action Required',       bg: Colors.dangerLight,  text: Colors.danger };
    case 'action_required': return { label: '⚠ Action Required',    bg: Colors.dangerLight,  text: Colors.danger };
    default:              return { label: '○ Not Submitted',          bg: Colors.borderLight,  text: Colors.textMuted };
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function DriverProfileSection() {
  const { driver } = useAuth();
  const router = useRouter();
  const [compliance, setCompliance] = useState<any>(null);
  const [loadingCompliance, setLoadingCompliance] = useState(true);

  const loadCompliance = async () => {
    try {
      const res = await apiClient('/compliance');
      setCompliance(res);
    } catch (e) {
      console.error('Failed to load compliance:', e);
    } finally {
      setLoadingCompliance(false);
    }
  };

  useEffect(() => { loadCompliance(); }, []);

  if (!driver) return null;

  const docsBySlug: Record<string, any> = {};
  (compliance?.documents || []).forEach((d: any) => {
    docsBySlug[d.documentType] = d;
  });

  const overallBadge = getOverallBadge(compliance?.overallStatus || 'not_submitted');

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        <View style={styles.detailCard}>
          <DetailRow icon={Mail} label="Email" value={driver.email} />
          <DetailRow icon={Phone} label="Phone" value={driver.phone || '—'} />
          <DetailRow icon={CreditCard} label="Licence" value={driver.licenceNumber || '—'} />
          <DetailRow icon={Clock} label="Licence Expiry" value={driver.licenceExpiry ? formatDate(driver.licenceExpiry) : '—'} last />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Compliance Documents</Text>
          <View style={[styles.overallBadge, { backgroundColor: overallBadge.bg }]}>
            <Text style={[styles.overallBadgeText, { color: overallBadge.text }]}>
              {overallBadge.label}
            </Text>
          </View>
        </View>

        {loadingCompliance ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 16 }} />
        ) : (
          <View style={styles.complianceList}>
            {REQUIRED_DOC_TYPES.map((type, index) => {
              const doc = docsBySlug[type.slug];
              const status = doc?.status || 'not_submitted';
              const { Icon: StatusIcon, color } = getComplianceIcon(status);
              const isLast = index === REQUIRED_DOC_TYPES.length - 1;

              return (
                <View key={type.slug} style={[styles.complianceRow, isLast && { borderBottomWidth: 0 }]}>
                  <Shield size={16} color={Colors.textMuted} />
                  <View style={styles.complianceInfo}>
                    <Text style={styles.complianceType}>{type.label}</Text>
                    <Text style={[styles.complianceStatus, { color }]}>
                      {getStatusLabel(status)}
                    </Text>
                    {doc?.expiryDate && (
                      <Text style={styles.complianceExpiry}>
                        Expires {formatDate(doc.expiryDate)}
                      </Text>
                    )}
                    {status === 'rejected' && doc?.rejectionReason && (
                      <Text style={styles.rejectionReason}>
                        Reason: {doc.rejectionReason}
                      </Text>
                    )}
                  </View>
                  <View style={styles.complianceActions}>
                    <StatusIcon size={18} color={color} />
                    <TouchableOpacity
                      style={styles.uploadBtn}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push((`/compliance-upload?docType=${type.slug}`) as any);
                      }}
                    >
                      {status === 'not_submitted' ? (
                        <Upload size={14} color={Colors.primary} />
                      ) : (
                        <RefreshCw size={14} color={status === 'rejected' ? Colors.danger : Colors.textMuted} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </>
  );
}

function CustomerProfileSection() {
  const { customer } = useAuth();
  const router = useRouter();
  if (!customer) return null;

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        <View style={styles.detailCard}>
          <DetailRow icon={Mail} label="Email" value={customer.email} />
          <DetailRow icon={Phone} label="Phone" value={customer.phone} />
          {customer.defaultAddress && (
            <DetailRow icon={MapPin} label="Default Address" value={`${customer.defaultAddress}, ${customer.defaultCity}`} />
          )}
          <DetailRow icon={Package} label="Total Deliveries" value={String(customer.totalDeliveries)} last />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Management</Text>
        <View style={styles.menuCard}>
          <MenuItem icon={Building2} label="Company Profile" accent={Colors.customerPrimary} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/company-profile' as any);
          }} />
          <MenuItem icon={Users} label="Team Management" accent={Colors.customerPrimary} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/user-management' as any);
          }} />
          <MenuItem icon={BarChart3} label="Analytics" accent={Colors.customerPrimary} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/customer-analytics' as any);
          }} />
          <MenuItem icon={Brain} label="AI Assistant" accent={Colors.customerPrimary} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/customer-ai' as any);
          }} last />
        </View>
      </View>
    </>
  );
}

function AdminProfileSection() {
  const { admin } = useAuth();
  if (!admin) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Admin Details</Text>
      <View style={styles.detailCard}>
        <DetailRow icon={Mail} label="Email" value={admin.email} />
        <DetailRow icon={Phone} label="Phone" value={admin.phone} />
        <DetailRow icon={Shield} label="Role" value={admin.role.replace('_', ' ').toUpperCase()} />
        <DetailRow icon={Clock} label="Member Since" value={formatDate(admin.memberSince)} last />
      </View>
    </View>
  );
}

function CarrierProfileSection() {
  const { carrier } = useAuth();
  const router = useRouter();
  // carrier comes from the basic User auth object — not all carrier-profile fields are present
  if (!carrier) return null;
  const c = carrier as any;

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company Details</Text>
        <View style={styles.detailCard}>
          <DetailRow icon={Mail} label="Email" value={c.email || '—'} />
          <DetailRow icon={Phone} label="Phone" value={c.phone || '—'} />
          {c.registrationNumber ? <DetailRow icon={CreditCard} label="Registration" value={c.registrationNumber} /> : null}
          {c.vatNumber ? <DetailRow icon={Shield} label="VAT Number" value={c.vatNumber} /> : null}
          {c.operatorLicence ? <DetailRow icon={FileText} label="Operator Licence" value={c.operatorLicence} /> : null}
          {Array.isArray(c.coverageRegions) && c.coverageRegions.length > 0 ? (
            <DetailRow icon={MapPin} label="Coverage" value={c.coverageRegions.slice(0, 3).join(', ')} last />
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Carrier Management</Text>
        <View style={styles.menuCard}>
          <MenuItem icon={Building2} label="Company Profile" accent={Colors.carrierPrimary} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/carrier-profile' as any);
          }} />
          <MenuItem icon={Receipt} label="Rate Management" accent={Colors.carrierPrimary} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/carrier-rates' as any);
          }} />
          <MenuItem icon={BarChart3} label="Performance Analytics" accent={Colors.carrierPrimary} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/carrier-analytics' as any);
          }} />
          <MenuItem icon={Brain} label="AI Assistant" accent={Colors.carrierPrimary} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/carrier-ai' as any);
          }} last />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compliance Documents</Text>
        <View style={styles.complianceList}>
          {MOCK_CARRIER_COMPLIANCE.map((item: any, index: number) => {
            const { Icon: StatusIcon, color } = getComplianceIcon(item.status);
            return (
              <View key={item.id} style={[styles.complianceRow, index === MOCK_CARRIER_COMPLIANCE.length - 1 && { borderBottomWidth: 0 }]}>
                <Shield size={16} color={Colors.textMuted} />
                <View style={styles.complianceInfo}>
                  <Text style={styles.complianceType}>{item.type}</Text>
                  {item.expiryDate && (
                    <Text style={[
                      styles.complianceExpiry,
                      item.status === 'EXPIRED' && { color: Colors.danger },
                      item.status === 'EXPIRING_SOON' && { color: Colors.warning },
                    ]}>
                      {item.status === 'EXPIRED' ? 'Expired ' : 'Expires '}
                      {formatDate(item.expiryDate)}
                    </Text>
                  )}
                </View>
                <StatusIcon size={18} color={color} />
              </View>
            );
          })}
        </View>
      </View>
    </>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { driver, customer, admin, carrier, userRole, logout } = useAuth();
  const isDriver = userRole === 'driver';
  const isAdmin = userRole === 'admin';
  const isCarrier = userRole === 'carrier';

  const accent = isDriver
    ? Colors.primary
    : isAdmin
      ? Colors.adminPrimary
      : isCarrier
        ? Colors.carrierPrimary
        : Colors.customerPrimary;

  const profile = isDriver ? driver : isAdmin ? admin : isCarrier ? carrier : customer;
  const firstName = isCarrier
    ? ((carrier as any)?.contactFirstName ?? (carrier as any)?.firstName ?? '')
    : (profile as any)?.firstName ?? '';
  const lastName = isCarrier
    ? ((carrier as any)?.contactLastName ?? (carrier as any)?.lastName ?? '')
    : (profile as any)?.lastName ?? '';

  const roleName = isDriver ? 'Driver' : isAdmin ? 'Admin' : isCarrier ? 'Carrier' : 'Customer';

  const handleLogout = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await logout();
          router.replace('/login' as any);
        },
      },
    ]);
  }, [logout, router]);

  if (!profile) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: accent }]}>
            <Text style={styles.avatarText}>
              {firstName[0]}{lastName[0]}
            </Text>
          </View>
          {isDriver && driver && (
            <View style={styles.ratingBadge}>
              <Star size={10} color={Colors.warning} fill={Colors.warning} />
              <Text style={styles.ratingText}>{driver.rating}</Text>
            </View>
          )}
        </View>
        <Text style={styles.profileName}>{`${firstName} ${lastName}`}</Text>
        <View style={[styles.roleBadge, { backgroundColor: accent + '18' }]}>
          <Text style={[styles.roleBadgeText, { color: accent }]}>
            {roleName}
          </Text>
        </View>
        {isDriver && driver && (
          <Text style={styles.driverNumber}>{driver.driverNumber}</Text>
        )}

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/edit-profile' as any);
          }}
          activeOpacity={0.7}
          testID="edit-profile-button"
        >
          <Edit3 size={14} color={accent} />
          <Text style={[styles.editButtonText, { color: accent }]}>Edit Profile</Text>
        </TouchableOpacity>

        <View style={styles.quickStats}>
          {isDriver && driver ? (
            <>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{driver.totalJobsCompleted}</Text>
                <Text style={styles.quickStatLabel}>Jobs Done</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{driver.rating}</Text>
                <Text style={styles.quickStatLabel}>Rating</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>
                  {new Date(driver.memberSince).getFullYear()}
                </Text>
                <Text style={styles.quickStatLabel}>Since</Text>
              </View>
            </>
          ) : isCarrier && carrier ? (
            <>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{carrier.totalJobsCompleted}</Text>
                <Text style={styles.quickStatLabel}>Jobs Done</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{carrier.rating}</Text>
                <Text style={styles.quickStatLabel}>Rating</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{carrier.slaScore}%</Text>
                <Text style={styles.quickStatLabel}>SLA</Text>
              </View>
            </>
          ) : isAdmin && admin ? (
            <>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{admin.role === 'super_admin' ? 'Super' : 'Admin'}</Text>
                <Text style={styles.quickStatLabel}>Access Level</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>
                  {new Date(admin.memberSince).getFullYear()}
                </Text>
                <Text style={styles.quickStatLabel}>Since</Text>
              </View>
            </>
          ) : customer ? (
            <>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>{customer.totalDeliveries}</Text>
                <Text style={styles.quickStatLabel}>Deliveries</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>
                  {new Date(customer.memberSince).getFullYear()}
                </Text>
                <Text style={styles.quickStatLabel}>Since</Text>
              </View>
            </>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {isDriver ? <DriverProfileSection /> :
          isCarrier ? <CarrierProfileSection /> :
            isAdmin ? <AdminProfileSection /> :
              <CustomerProfileSection />}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuCard}>
            <MenuItem icon={HelpCircle} label="Help Centre" accent={accent} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/support' as any);
            }} />
            <MenuItem icon={FileText} label="Terms & Conditions" accent={accent} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/support' as any);
            }} />
            <MenuItem icon={Phone} label="Contact Support" accent={accent} last onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/support' as any);
            }} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
          testID="logout-button"
        >
          <LogOut size={18} color={Colors.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>CYVhub v1.0.0</Text>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon: Icon, label, value, last }: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <Icon size={16} color={Colors.primary} />
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function MenuItem({ icon: Icon, label, accent, last, onPress }: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  accent: string;
  last?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.menuItem, !last && styles.menuItemBorder]} activeOpacity={0.6} onPress={onPress}>
      <Icon size={18} color={accent} />
      <Text style={styles.menuLabel}>{label}</Text>
      <ChevronRight size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
    borderWidth: 2,
    borderColor: Colors.navy,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.textInverse,
  },
  roleBadge: {
    backgroundColor: Colors.navyLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  driverNumber: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyLight,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 16,
    width: '100%',
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  quickStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.navyMedium,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  detailCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  complianceList: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  complianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  complianceInfo: {
    flex: 1,
  },
  complianceType: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  complianceExpiry: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dangerLight,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.navyLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  complianceStatus: {
    fontSize: 11,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  rejectionReason: {
    fontSize: 11,
    color: Colors.danger,
    marginTop: 3,
    fontStyle: 'italic' as const,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 10,
  },
  overallBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overallBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  complianceActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  uploadBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.borderLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
