import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Mail,
  MessageSquare,
  Settings as SettingsIcon,
  Save,
  Send,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

type TabView = 'email' | 'sms' | 'rules' | 'security';

interface NotificationSettings {
  emailEnabled: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  emailFromName: string;
  emailFromAddr: string;

  smsEnabled: boolean;
  twilioSid: string;
  twilioToken: string;
  twilioFrom: string;

  notifyOnJobCreated: boolean;
  notifyOnJobAssigned: boolean;
  notifyOnJobDelivered: boolean;
  notifyOnPayment: boolean;
}

interface NotificationLog {
  id: string;
  type: string;
  recipient: string;
  message: string;
  subject?: string;
  status: string;
  error?: string;
  createdAt: string;
}

export default function AdminNotificationSettings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabView>('email');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showToken, setShowToken] = useState(false);
  
  const [testEmail, setTestEmail] = useState('');
  const [testSms, setTestSms] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: false,
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    emailFromName: '',
    emailFromAddr: '',
    smsEnabled: false,
    twilioSid: '',
    twilioToken: '',
    twilioFrom: '',
    notifyOnJobCreated: true,
    notifyOnJobAssigned: true,
    notifyOnJobDelivered: true,
    notifyOnPayment: true,
  });

  const [logs, setLogs] = useState<NotificationLog[]>([]);

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await apiClient('/settings/notifications');
      setSettings((prev) => ({
        ...prev,
        ...data,
        smtpPort: data.smtpPort ? data.smtpPort.toString() : '',
      }));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await apiClient('/settings/notifications/logs');
      setLogs(data);
    } catch (err) {
      console.log('Failed to fetch logs', err);
    }
  };

  const updateField = (field: keyof NotificationSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...settings,
        smtpPort: settings.smtpPort ? parseInt(settings.smtpPort, 10) : null,
      };

      const data = await apiClient('/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setSettings((prev) => ({
        ...prev,
        ...data,
        smtpPort: data.smtpPort ? data.smtpPort.toString() : '',
      }));

      Alert.alert('Success', 'Notification settings saved successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) return Alert.alert('Error', 'Please enter a test email address');
    try {
      await apiClient('/settings/notifications/test-email', {
        method: 'POST',
        body: JSON.stringify({ email: testEmail })
      });
      Alert.alert('Success', 'Test email dispatched. Check server logs if not received.');
      fetchLogs();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send test email');
    }
  };

  const handleTestSms = async () => {
    if (!testSms) return Alert.alert('Error', 'Please enter a test phone number');
    try {
      await apiClient('/settings/notifications/test-sms', {
        method: 'POST',
        body: JSON.stringify({ phone: testSms })
      });
      Alert.alert('Success', 'Test SMS dispatched. Check server logs if not received.');
      fetchLogs();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send test SMS');
    }
  };

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return Alert.alert('Error', 'Please fill out all password fields');
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert('Error', 'New password and confirm password do not match');
    }
    
    setChangingPassword(true);
    try {
      await apiClient('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword })
      });
      Alert.alert('Success', 'Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={Colors.adminPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  const renderEmailTab = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.cardTitle}>Enable Email Delivery</Text>
            <Text style={styles.cardDesc}>Toggle global email notifications on or off.</Text>
          </View>
          <Switch
            value={settings.emailEnabled}
            onValueChange={(val) => updateField('emailEnabled', val)}
            trackColor={{ true: Colors.adminPrimary, false: Colors.border }}
          />
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>SMTP Configuration</Text>
        <Text style={styles.infoText}>Leave fields blank to fall back to environment variables.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>SMTP Host</Text>
          <TextInput
            style={styles.input}
            value={settings.smtpHost}
            onChangeText={(v) => updateField('smtpHost', v)}
            placeholder="e.g. smtp.sendgrid.net"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>SMTP Port</Text>
          <TextInput
            style={styles.input}
            value={settings.smtpPort}
            onChangeText={(v) => updateField('smtpPort', v)}
            placeholder="e.g. 587"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>SMTP Username</Text>
          <TextInput
            style={styles.input}
            value={settings.smtpUser}
            onChangeText={(v) => updateField('smtpUser', v)}
            placeholder="Username or API Key"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>SMTP Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={settings.smtpPass}
              onChangeText={(v) => updateField('smtpPass', v)}
              placeholder="********"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeIcon}>
              {showPass ? <EyeOff size={20} color={Colors.textMuted} /> : <Eye size={20} color={Colors.textMuted} />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Sender Details</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>From Name</Text>
          <TextInput
            style={styles.input}
            value={settings.emailFromName}
            onChangeText={(v) => updateField('emailFromName', v)}
            placeholder="e.g. CYVhub Notifications"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>From Address</Text>
          <TextInput
            style={styles.input}
            value={settings.emailFromAddr}
            onChangeText={(v) => updateField('emailFromAddr', v)}
            placeholder="e.g. noreply@cyvhub.com"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Test Email</Text>
        <Text style={styles.cardDesc}>Send a test email using the currently saved settings.</Text>
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 10 }}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="admin@example.com"
            value={testEmail}
            onChangeText={setTestEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity style={styles.testBtn} onPress={handleTestEmail}>
            <Send size={16} color="#fff" />
            <Text style={styles.testBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderSmsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.cardTitle}>Enable SMS Delivery</Text>
            <Text style={styles.cardDesc}>Toggle global SMS notifications on or off.</Text>
          </View>
          <Switch
            value={settings.smsEnabled}
            onValueChange={(val) => updateField('smsEnabled', val)}
            trackColor={{ true: Colors.adminPrimary, false: Colors.border }}
          />
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Twilio Configuration</Text>
        <Text style={styles.infoText}>Leave fields blank to fall back to environment variables.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Account SID</Text>
          <TextInput
            style={styles.input}
            value={settings.twilioSid}
            onChangeText={(v) => updateField('twilioSid', v)}
            placeholder="ACxxxxxxxxxxxxxxxxx"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Auth Token</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={settings.twilioToken}
              onChangeText={(v) => updateField('twilioToken', v)}
              placeholder="********"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showToken}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowToken(!showToken)} style={styles.eyeIcon}>
              {showToken ? <EyeOff size={20} color={Colors.textMuted} /> : <Eye size={20} color={Colors.textMuted} />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>From Number</Text>
          <TextInput
            style={styles.input}
            value={settings.twilioFrom}
            onChangeText={(v) => updateField('twilioFrom', v)}
            placeholder="+1234567890"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Test SMS</Text>
        <Text style={styles.cardDesc}>Send a test SMS using the currently saved settings.</Text>
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 10 }}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="+447700900000"
            value={testSms}
            onChangeText={setTestSms}
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.testBtn} onPress={handleTestSms}>
            <Send size={16} color="#fff" />
            <Text style={styles.testBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderRulesTab = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notification Rules</Text>
        <Text style={styles.cardDesc}>Configure which events trigger automated notifications.</Text>
        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <Text style={styles.ruleLabel}>Job Created</Text>
          <Switch
            value={settings.notifyOnJobCreated}
            onValueChange={(val) => updateField('notifyOnJobCreated', val)}
            trackColor={{ true: Colors.adminPrimary, false: Colors.border }}
          />
        </View>
        <View style={styles.dividerSmall} />
        
        <View style={styles.switchRow}>
          <Text style={styles.ruleLabel}>Job Assigned to Driver/Carrier</Text>
          <Switch
            value={settings.notifyOnJobAssigned}
            onValueChange={(val) => updateField('notifyOnJobAssigned', val)}
            trackColor={{ true: Colors.adminPrimary, false: Colors.border }}
          />
        </View>
        <View style={styles.dividerSmall} />
        
        <View style={styles.switchRow}>
          <Text style={styles.ruleLabel}>Job Delivered</Text>
          <Switch
            value={settings.notifyOnJobDelivered}
            onValueChange={(val) => updateField('notifyOnJobDelivered', val)}
            trackColor={{ true: Colors.adminPrimary, false: Colors.border }}
          />
        </View>
        <View style={styles.dividerSmall} />
        
        <View style={styles.switchRow}>
          <Text style={styles.ruleLabel}>Payment Processed</Text>
          <Switch
            value={settings.notifyOnPayment}
            onValueChange={(val) => updateField('notifyOnPayment', val)}
            trackColor={{ true: Colors.adminPrimary, false: Colors.border }}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Logs</Text>
        <Text style={styles.cardDesc}>History of the last 50 notification attempts.</Text>
        <View style={styles.divider} />
        {logs.length === 0 ? (
          <Text style={styles.infoText}>No logs found.</Text>
        ) : (
          logs.map(log => (
            <View key={log.id} style={styles.logItem}>
              <View style={styles.logHeader}>
                <View style={[styles.logBadge, { backgroundColor: log.type === 'EMAIL' ? '#DBEAFE' : '#E0E7FF' }]}>
                  <Text style={[styles.logBadgeText, { color: log.type === 'EMAIL' ? '#2563EB' : '#4F46E5' }]}>{log.type}</Text>
                </View>
                <Text style={styles.logDate}>{new Date(log.createdAt).toLocaleString()}</Text>
              </View>
              <Text style={styles.logRecipient}>{log.recipient}</Text>
              <Text style={styles.logMessage} numberOfLines={2}>{log.subject || log.message}</Text>
              <Text style={[styles.logStatus, { color: log.status === 'SUCCESS' ? Colors.success : Colors.danger }]}>
                {log.status === 'SUCCESS' ? 'Delivered' : `Failed: ${log.error}`}
              </Text>
            </View>
          ))
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderSecurityTab = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Change Admin Password</Text>
        <Text style={styles.cardDesc}>Update your administrator password. You will use this new password on your next login.</Text>
        <View style={styles.divider} />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={oldPassword}
            onChangeText={setOldPassword}
            placeholder="********"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="********"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="********"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={[styles.testBtn, { marginTop: 16 }]} 
          onPress={handlePasswordChange}
          disabled={changingPassword}
        >
          {changingPassword ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.testBtnText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications Base</Text>
          </View>
          <TouchableOpacity style={styles.saveBtnTop} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Save size={20} color="#fff" />}
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'email' && styles.tabActive]}
            onPress={() => setActiveTab('email')}
          >
            <Mail size={16} color={activeTab === 'email' ? Colors.adminPrimary : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'email' && styles.tabTextActive]}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sms' && styles.tabActive]}
            onPress={() => setActiveTab('sms')}
          >
            <MessageSquare size={16} color={activeTab === 'sms' ? Colors.adminPrimary : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'sms' && styles.tabTextActive]}>SMS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'rules' && styles.tabActive]}
            onPress={() => setActiveTab('rules')}
          >
            <SettingsIcon size={16} color={activeTab === 'rules' ? Colors.adminPrimary : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'rules' && styles.tabTextActive]}>Rules</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'security' && styles.tabActive]}
            onPress={() => setActiveTab('security')}
          >
            <SettingsIcon size={16} color={activeTab === 'security' ? Colors.adminPrimary : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'security' && styles.tabTextActive]}>Security</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'email' && renderEmailTab()}
          {activeTab === 'sms' && renderSmsTab()}
          {activeTab === 'rules' && renderRulesTab()}
          {activeTab === 'security' && renderSecurityTab()}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.navy },
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.navy, paddingHorizontal: 16, paddingVertical: 14,
    paddingTop: Platform.OS === 'web' ? 14 : 8,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  saveBtnTop: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.adminPrimary, alignItems: 'center', justifyContent: 'center' },
  
  tabRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.adminPrimary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.adminPrimary },
  
  content: { flex: 1 },
  tabContent: { padding: 16 },
  
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: Colors.textSecondary },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 16 },
  dividerSmall: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 8 },
  
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4, textTransform: 'uppercase' },
  infoText: { fontSize: 12, color: Colors.textMuted, marginBottom: 16 },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  input: { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, fontSize: 14, color: Colors.text },
  
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border, borderRadius: 10 },
  passwordInput: { flex: 1, padding: 12, fontSize: 14, color: Colors.text },
  eyeIcon: { padding: 12 },
  
  testBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.adminPrimary, paddingHorizontal: 16, borderRadius: 10 },
  testBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  
  ruleLabel: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  
  logItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  logBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  logBadgeText: { fontSize: 10, fontWeight: '700' },
  logDate: { fontSize: 11, color: Colors.textMuted },
  logRecipient: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  logMessage: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  logStatus: { fontSize: 12, fontWeight: '600' },
});
