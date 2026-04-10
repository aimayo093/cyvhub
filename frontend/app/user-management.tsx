import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Clock,
  MoreVertical,
  X,
  ChevronDown,
  Send,
  Trash2,
  CheckCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';

// Internal type definition to replace the mock library
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Account Owner' | 'Manager' | 'User' | 'Viewer';
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  lastLogin?: string;
  joinDate: string;
}

const ROLE_OPTIONS: TeamMember['role'][] = ['Account Owner', 'Manager', 'User', 'Viewer'];

const ROLE_COLORS: Record<string, string> = {
  'Account Owner': Colors.customerPrimary,
  'Manager': Colors.primary,
  'User': Colors.purple,
  'Viewer': Colors.textMuted,
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function UserManagementScreen() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('User');
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const handleInvite = useCallback(() => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      Alert.alert('Missing Info', 'Please fill in name and email.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      status: 'INVITED',
      joinDate: new Date().toISOString().split('T')[0],
    };
    setMembers(prev => [...prev, newMember]);
    setShowInvite(false);
    setInviteName('');
    setInviteEmail('');
    setInviteRole('User');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Invitation Sent', `An invitation has been sent to ${newMember.email}.`);
  }, [inviteName, inviteEmail, inviteRole]);

  const handleRemoveMember = useCallback((memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member?.role === 'Account Owner') {
      Alert.alert('Cannot Remove', 'The account owner cannot be removed.');
      return;
    }
    Alert.alert('Remove User', `Remove ${member?.name} from the team?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setMembers(prev => prev.filter(m => m.id !== memberId));
          setSelectedMember(null);
        },
      },
    ]);
  }, [members]);

  const handleChangeRole = useCallback((memberId: string, newRole: TeamMember['role']) => {
    const member = members.find(m => m.id === memberId);
    if (member?.role === 'Account Owner') {
      Alert.alert('Cannot Change', 'The account owner role cannot be changed.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    setSelectedMember(null);
  }, [members]);

  const renderMember = useCallback(({ item }: { item: TeamMember }) => {
    const roleColor = ROLE_COLORS[item.role] ?? Colors.textMuted;
    const isSelected = selectedMember === item.id;

    return (
      <View style={styles.memberCard}>
        <View style={styles.memberMain}>
          <View style={[styles.memberAvatar, { backgroundColor: roleColor + '18' }]}>
            <Text style={[styles.memberInitial, { color: roleColor }]}>{item.name[0]}</Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{item.name}</Text>
            <Text style={styles.memberEmail}>{item.email}</Text>
          </View>
          <View style={styles.memberRight}>
            <View style={[styles.roleBadge, { backgroundColor: roleColor + '15' }]}>
              <Text style={[styles.roleText, { color: roleColor }]}>{item.role}</Text>
            </View>
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedMember(isSelected ? null : item.id);
              }}
            >
              <MoreVertical size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.memberMeta}>
          {item.status === 'INVITED' ? (
            <View style={styles.invitedBadge}>
              <Mail size={10} color={Colors.warning} />
              <Text style={styles.invitedText}>Invitation pending</Text>
            </View>
          ) : item.lastLogin ? (
            <View style={styles.lastLogin}>
              <Clock size={10} color={Colors.textMuted} />
              <Text style={styles.lastLoginText}>Last login: {timeAgo(item.lastLogin)}</Text>
            </View>
          ) : null}
          <Text style={styles.joinDate}>Joined {new Date(item.joinDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</Text>
        </View>

        {isSelected && (
          <View style={styles.actionMenu}>
            <Text style={styles.actionMenuTitle}>Change Role</Text>
            <View style={styles.actionRoles}>
              {ROLE_OPTIONS.filter(r => r !== 'Account Owner').map(role => (
                <TouchableOpacity
                  key={role}
                  style={[styles.actionRole, item.role === role && styles.actionRoleActive]}
                  onPress={() => handleChangeRole(item.id, role)}
                >
                  <Text style={[styles.actionRoleText, item.role === role && { color: '#FFF' }]}>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveMember(item.id)}>
              <Trash2 size={14} color={Colors.danger} />
              <Text style={styles.removeBtnText}>Remove User</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }, [selectedMember, handleChangeRole, handleRemoveMember]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Team Management',
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => { setShowInvite(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
              style={styles.headerBtn}
            >
              <UserPlus size={20} color={Colors.customerPrimary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ResponsiveContainer scrollable={false} backgroundColor="transparent">
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{members.length}</Text>
            <Text style={styles.summaryLabel}>Total Members</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{members.filter(m => m.status === 'ACTIVE').length}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{members.filter(m => m.status === 'INVITED').length}</Text>
            <Text style={styles.summaryLabel}>Invited</Text>
          </View>
        </View>
      </ResponsiveContainer>

      <ResponsiveContainer scrollable={false} backgroundColor="transparent">
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </ResponsiveContainer>

      <Modal visible={showInvite} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Text style={styles.modalTitle}>Invite Team Member</Text>
              <TouchableOpacity onPress={() => setShowInvite(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ResponsiveContainer scrollable={true} backgroundColor={Colors.background}>
            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name</Text>
                <View style={styles.formInput}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter name"
                    placeholderTextColor={Colors.textMuted}
                    value={inviteName}
                    onChangeText={setInviteName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email Address</Text>
                <View style={styles.formInput}>
                  <TextInput
                    style={styles.input}
                    placeholder="email@company.com"
                    placeholderTextColor={Colors.textMuted}
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Role</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowRolePicker(!showRolePicker)}>
                  <Text style={styles.pickerText}>{inviteRole}</Text>
                  <ChevronDown size={18} color={Colors.textMuted} />
                </TouchableOpacity>
                {showRolePicker && (
                  <View style={styles.pickerOptions}>
                    {ROLE_OPTIONS.filter(r => r !== 'Account Owner').map(role => (
                      <TouchableOpacity
                        key={role}
                        style={[styles.pickerOption, inviteRole === role && styles.pickerOptionActive]}
                        onPress={() => { setInviteRole(role); setShowRolePicker(false); }}
                      >
                        <Text style={[styles.pickerOptionText, inviteRole === role && { color: '#FFF' }]}>{role}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite} activeOpacity={0.8}>
                <Send size={18} color="#FFFFFF" />
                <Text style={styles.inviteBtnText}>Send Invitation</Text>
              </TouchableOpacity>
            </View>
          </ResponsiveContainer>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBtn: { padding: 8 },
  summary: { flexDirection: 'row', backgroundColor: Colors.surface, paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: Colors.border, width: '100%' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '800' as const, color: Colors.text },
  summaryLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  summaryDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  list: { paddingVertical: 16, paddingHorizontal: 0 },
  memberCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  memberMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  memberInitial: { fontSize: 18, fontWeight: '700' as const },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  memberEmail: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  memberRight: { alignItems: 'flex-end', gap: 6 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  roleText: { fontSize: 10, fontWeight: '700' as const },
  moreBtn: { padding: 4 },
  memberMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  invitedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  invitedText: { fontSize: 11, color: Colors.warning, fontWeight: '500' as const },
  lastLogin: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lastLoginText: { fontSize: 11, color: Colors.textMuted },
  joinDate: { fontSize: 11, color: Colors.textMuted },
  actionMenu: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  actionMenuTitle: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary, marginBottom: 8 },
  actionRoles: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  actionRole: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.surfaceAlt },
  actionRoleActive: { backgroundColor: Colors.customerPrimary },
  actionRoleText: { fontSize: 12, fontWeight: '600' as const, color: Colors.text },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  removeBtnText: { fontSize: 13, fontWeight: '600' as const, color: Colors.danger },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalHeaderContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, maxWidth: 1000, alignSelf: 'center', width: '100%' },
  modalTitle: { fontSize: 20, fontWeight: '800' as const, color: Colors.text },
  modalBody: { paddingVertical: 20, paddingHorizontal: 0 },
  formGroup: { marginBottom: 20 },
  formLabel: { fontSize: 14, fontWeight: '700' as const, color: Colors.text, marginBottom: 8 },
  formInput: { backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, minHeight: 48 },
  input: { flex: 1, fontSize: 14, color: Colors.text, height: 48 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, height: 48 },
  pickerText: { fontSize: 14, fontWeight: '500' as const, color: Colors.text },
  pickerOptions: { marginTop: 8, gap: 4 },
  pickerOption: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: Colors.surfaceAlt },
  pickerOptionActive: { backgroundColor: Colors.customerPrimary },
  pickerOptionText: { fontSize: 14, fontWeight: '500' as const, color: Colors.text },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.customerPrimary, borderRadius: 14, height: 56, gap: 8, marginTop: 12 },
  inviteBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
});
