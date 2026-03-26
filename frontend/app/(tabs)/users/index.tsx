import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  Filter,
  Users,
  Truck,
  ShoppingBag,

  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ShieldCheck,
  FileCheck,
} from 'lucide-react-native';

import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { UserRecord } from '@/types';

type UserFilter = 'all' | 'driver' | 'customer' | 'carrier';

function getStatusStyle(status: string) {
  switch (status) {
    case 'ACTIVE': return { bg: Colors.successLight, color: Colors.success, icon: CheckCircle };
    case 'INACTIVE': return { bg: '#F1F5F9', color: Colors.textMuted, icon: XCircle };
    case 'SUSPENDED': return { bg: Colors.dangerLight, color: Colors.danger, icon: AlertTriangle };
    case 'PENDING': return { bg: Colors.warningLight, color: Colors.warning, icon: Clock };
    default: return { bg: '#F1F5F9', color: Colors.textMuted, icon: Clock };
  }
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'driver': return { Icon: Truck, color: Colors.primary };
    case 'carrier': return { Icon: ShieldCheck, color: Colors.carrierPrimary };
    case 'customer': return { Icon: ShoppingBag, color: Colors.customerPrimary };
    default: return { Icon: Users, color: Colors.textMuted };
  }
}

import { apiClient } from '@/services/api';

export default function UsersScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<UserFilter>('all');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiClient('/admin/users');
      setUsers(data || []);
    } catch (err) {
      console.error('fetchUsers error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (activeFilter !== 'all') {
      result = result.filter((u: any) => u.role === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((u: any) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) ||
        u.carrierProfile?.companyName?.toLowerCase().includes(q) ||
        u.businessProfile?.companyName?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, activeFilter, searchQuery]);

  const counts: Record<UserFilter, number> = useMemo(() => ({
    all: users.length,
    driver: users.filter((u: any) => u.role === 'driver').length,
    customer: users.filter((u: any) => u.role === 'customer').length,
    carrier: users.filter((u: any) => u.role === 'carrier').length,
  }), [users]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, [fetchUsers]);

  const handleUserAction = useCallback((user: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userName = `${user.firstName} ${user.lastName}`;
    const actions = user.status === 'SUSPENDED'
      ? [
        { text: 'Reactivate', onPress: () => { } },
        { text: 'Edit', onPress: () => router.push(`/(tabs)/users/${user.id}` as any) },
        { text: 'Suspend', style: 'destructive' as const, onPress: () => { } },
        { text: 'View Details', onPress: () => { } },
        { text: 'Cancel', style: 'cancel' as const },
      ]
      : [
        { text: 'Suspend', style: 'destructive' as const, onPress: () => { } },
        { text: 'View Details', onPress: () => { } },
        { text: 'Cancel', style: 'cancel' as const },
      ];
    Alert.alert(userName, `Role: ${user.role} | Status: ${user.status}`, actions);
  }, []);

  const filters: { key: UserFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'driver', label: 'Drivers' },
    { key: 'carrier', label: 'Carriers' },
    { key: 'customer', label: 'Customers' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>User Management</Text>
            <Text style={styles.headerSubtitle}>{counts.all} total users</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[styles.headerIconWrap, { backgroundColor: Colors.success + '18' }]}
              onPress={() => router.push('/admin-compliance' as any)}
              activeOpacity={0.7}
            >
              <FileCheck size={20} color={Colors.success} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerIconWrap, { backgroundColor: Colors.danger + '18' }]}
              onPress={() => router.push('/(tabs)/users/audit')}
              activeOpacity={0.7}
            >
              <ShieldCheck size={20} color={Colors.danger} />
            </TouchableOpacity>
            <View style={styles.headerIconWrap}>
              <Users size={20} color={loading ? Colors.textMuted : Colors.adminPrimary} />
            </View>
          </View>

        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              testID="user-search"
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
              onPress={() => {
                setActiveFilter(f.key);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
              <View style={[styles.filterCount, activeFilter === f.key && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, activeFilter === f.key && styles.filterCountTextActive]}>
                  {counts[f.key]}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.adminPrimary} />
        }
      >
        {filteredUsers.map((user: any) => {
          const statusStyle = getStatusStyle(user.status);
          const roleInfo = getRoleIcon(user.role);
          const StatusIcon = statusStyle.icon;
          const RoleIcon = roleInfo.Icon;

          return (
            <TouchableOpacity
              key={user.id}
              style={styles.userCard}
              activeOpacity={0.7}
              onPress={() => handleUserAction(user)}
            >
              <View style={styles.userCardLeft}>
                <View style={[styles.userAvatar, { backgroundColor: roleInfo.color + '18' }]}>
                  <RoleIcon size={18} color={roleInfo.color} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>{user.firstName} {user.lastName}</Text>
                  <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
                  <View style={styles.userMeta}>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <StatusIcon size={10} color={statusStyle.color} />
                      <Text style={[styles.statusText, { color: statusStyle.color }]}>{user.status}</Text>
                    </View>
                    <Text style={styles.activityText}>{user.role.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => handleUserAction(user)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MoreVertical size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        {filteredUsers.length === 0 && (
          <View style={styles.emptyState}>
            <Search size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or filter</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
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
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.textInverse,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.adminPrimary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textInverse,
  },
  filterRow: {
    gap: 8,
    paddingRight: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.adminPrimary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterCount: {
    backgroundColor: Colors.navyMedium,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  filterCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textMuted,
  },
  filterCountTextActive: {
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  activityText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  moreButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
