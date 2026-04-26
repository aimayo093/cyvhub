import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Save } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';

export default function AISettingsScreen() {
  const { admin } = useAuth();
  const isSuper = (admin as any)?.role === 'super_admin';
  const [settings, setSettings] = useState<any | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient('/ai/settings').then(r => setSettings(r.settings)).catch(() => null),
      apiClient('/ai/logs').then(r => setLogs(r.logs || [])).catch(() => null),
    ]).finally(() => setLoading(false));
  }, []);

  const setBool = (key: string, value: boolean) => setSettings((prev: any) => ({ ...prev, [key]: value }));
  const save = async () => {
    if (!isSuper) return Alert.alert('Restricted', 'Only Super Admin can change AI settings.');
    const res = await apiClient('/ai/settings', { method: 'PATCH', body: JSON.stringify(settings) });
    setSettings(res.settings);
    Alert.alert('Saved', 'AI settings updated.');
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.adminPrimary} /></View>;
  if (!settings) return <View style={styles.center}><Text style={styles.muted}>Super Admin access required.</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Settings</Text>
        <Text style={styles.subtitle}>AI drafts and suggestions stay behind backend validation, RBAC, pricing, dispatch, and payment rules.</Text>
      </View>
      <View style={styles.panel}>
        <Toggle label="Enable AI assistant" value={settings.enabled} onValueChange={(v) => setBool('enabled', v)} />
        <Toggle label="Support replies draft only" value={settings.supportDraftOnly} onValueChange={(v) => setBool('supportDraftOnly', v)} />
        <Toggle label="Allow guided booking" value={settings.bookingAssistantEnabled} onValueChange={(v) => setBool('bookingAssistantEnabled', v)} />
        <Toggle label="Tracking assistant" value={settings.trackingAssistantEnabled} onValueChange={(v) => setBool('trackingAssistantEnabled', v)} />
        <Toggle label="Dispatch suggestions only" value={settings.dispatchAssistantEnabled} onValueChange={(v) => setBool('dispatchAssistantEnabled', v)} />
        <Toggle label="Payment confirmation required" value={true} onValueChange={() => {}} disabled />
        <TouchableOpacity style={styles.save} onPress={save}><Save size={16} color="#FFFFFF" /><Text style={styles.saveText}>Save Settings</Text></TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>AI Audit Log</Text>
      {logs.map(log => (
        <View key={log.id} style={styles.log}>
          <Text style={styles.logTitle}>{log.actionType}</Text>
          <Text style={styles.logMeta}>{log.role || 'unknown'} - {new Date(log.createdAt).toLocaleString()}</Text>
          <Text style={styles.logSummary}>{log.summary}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function Toggle({ label, value, onValueChange, disabled }: { label: string; value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <View style={styles.toggle}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text },
  subtitle: { color: Colors.textSecondary, marginTop: 6, lineHeight: 21 },
  panel: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 16 },
  toggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  toggleLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  save: { marginTop: 16, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.adminPrimary, borderRadius: 8, padding: 14 },
  saveText: { color: '#FFFFFF', fontWeight: '800' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 24, marginBottom: 10 },
  log: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, marginBottom: 8 },
  logTitle: { fontWeight: '800', color: Colors.text },
  logMeta: { color: Colors.textMuted, fontSize: 12, marginTop: 3 },
  logSummary: { color: Colors.textSecondary, marginTop: 8 },
  muted: { color: Colors.textMuted },
});
