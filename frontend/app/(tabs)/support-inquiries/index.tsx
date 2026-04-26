import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Bot, Mail, Send, UserCheck } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';

const statuses = ['NEW', 'IN_PROGRESS', 'RESOLVED'];

export default function SupportInquiriesScreen() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const { admin } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inq, tmpl] = await Promise.all([apiClient('/knowledge/inquiries'), apiClient('/knowledge/templates')]);
      setInquiries(inq.inquiries || []);
      setTemplates(tmpl.templates || []);
      if (selected?.id) {
        const detail = await apiClient(`/knowledge/inquiries/${selected.id}`);
        setSelected(detail.inquiry);
      }
    } finally {
      setLoading(false);
    }
  }, [selected?.id]);

  useEffect(() => { load(); }, []);

  const suggested = useMemo(() => {
    if (!selected) return templates.slice(0, 4);
    const text = selected.message.toLowerCase();
    return templates.filter(t => `${t.title} ${t.scenario} ${t.category?.name || ''}`.toLowerCase().split(/\s+/).some(word => word.length > 4 && text.includes(word))).slice(0, 4).concat(templates.slice(0, 2)).slice(0, 4);
  }, [selected, templates]);

  const openInquiry = async (id: string) => {
    const detail = await apiClient(`/knowledge/inquiries/${id}`);
    setSelected(detail.inquiry);
    setReply('');
  };

  const updateStatus = async (status: string) => {
    if (!selected) return;
    const res = await apiClient(`/knowledge/inquiries/${selected.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    setSelected({ ...selected, ...res.inquiry });
    await load();
  };

  const assignToMe = async () => {
    if (!selected) return;
    await apiClient(`/knowledge/inquiries/${selected.id}`, { method: 'PATCH', body: JSON.stringify({ assignedAdminId: (admin as any)?.id || (admin as any)?.userId }) });
    await load();
  };

  const draft = async () => {
    if (!selected) return;
    setDrafting(true);
    try {
      const res = await apiClient(`/ai/inquiries/${selected.id}/draft`, { method: 'POST', body: JSON.stringify({}) });
      setReply(res.draft || '');
    } finally {
      setDrafting(false);
    }
  };

  const send = async () => {
    if (!selected || !reply.trim()) return;
    await apiClient(`/knowledge/inquiries/${selected.id}/responses`, { method: 'POST', body: JSON.stringify({ message: reply }) });
    Alert.alert('Response sent', 'The response was saved to history and sent to the customer.');
    setReply('');
    await openInquiry(selected.id);
  };

  if (loading && !inquiries.length) return <View style={styles.center}><ActivityIndicator color={Colors.adminPrimary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customer Inquiries</Text>
        <Text style={styles.subtitle}>Internal support queue with templates and AI-assisted drafts.</Text>
      </View>
      <View style={styles.shell}>
        <ScrollView style={styles.list}>
          {inquiries.map(item => (
            <TouchableOpacity key={item.id} style={[styles.card, selected?.id === item.id && styles.cardActive]} onPress={() => openInquiry(item.id)}>
              <Text style={styles.cardTitle}>{item.customerName}</Text>
              <Text style={styles.cardMeta}>{item.email} {item.bookingId ? `- ${item.bookingId}` : ''}</Text>
              <Text style={styles.badge}>{item.status}</Text>
              <Text numberOfLines={2} style={styles.message}>{item.message}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView style={styles.detail} contentContainerStyle={styles.detailContent}>
          {selected ? (
            <>
              <View style={styles.detailTop}>
                <View>
                  <Text style={styles.detailTitle}>{selected.customerName}</Text>
                  <Text style={styles.detailMeta}>{selected.email} {selected.phone ? `- ${selected.phone}` : ''}</Text>
                </View>
                <TouchableOpacity style={styles.assign} onPress={assignToMe}><UserCheck size={16} color={Colors.adminPrimary} /><Text style={styles.assignText}>Assign</Text></TouchableOpacity>
              </View>
              <View style={styles.statusRow}>{statuses.map(s => <TouchableOpacity key={s} style={[styles.status, selected.status === s && styles.statusActive]} onPress={() => updateStatus(s)}><Text style={[styles.statusText, selected.status === s && styles.statusTextActive]}>{s.replace('_', ' ')}</Text></TouchableOpacity>)}</View>
              <Text style={styles.sectionTitle}>Inquiry</Text>
              <Text style={styles.panelText}>{selected.message}</Text>
              <Text style={styles.sectionTitle}>Suggested Templates</Text>
              {suggested.map(t => <TouchableOpacity key={t.id} style={styles.template} onPress={() => setReply(t.responseMessage)}><Text style={styles.templateTitle}>{t.title}</Text><Text style={styles.templateScenario}>{t.scenario}</Text></TouchableOpacity>)}
              <View style={styles.replyHeader}>
                <Text style={styles.sectionTitle}>Reply</Text>
                <TouchableOpacity style={styles.aiButton} onPress={draft} disabled={drafting}><Bot size={16} color="#FFFFFF" /><Text style={styles.aiText}>{drafting ? 'Drafting...' : 'AI Draft'}</Text></TouchableOpacity>
              </View>
              <TextInput style={styles.reply} multiline value={reply} onChangeText={setReply} placeholder="Select a template or draft a response" />
              <TouchableOpacity style={styles.send} onPress={send}><Send size={16} color="#FFFFFF" /><Text style={styles.sendText}>Send Response</Text></TouchableOpacity>
              <Text style={styles.sectionTitle}>History</Text>
              {(selected.responses || []).map((r: any) => <View key={r.id} style={styles.history}><Mail size={14} color={Colors.textMuted} /><Text style={styles.historyText}>{r.message}</Text></View>)}
            </>
          ) : <Text style={styles.empty}>Select an inquiry.</Text>}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: Colors.navy, padding: 20 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  subtitle: { color: Colors.textMuted, marginTop: 4 },
  shell: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  list: { flex: 1, minWidth: 300, padding: 14 },
  detail: { flex: 2, minWidth: 340, backgroundColor: '#FFFFFF' },
  detailContent: { padding: 18 },
  card: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 14, marginBottom: 10 },
  cardActive: { borderColor: Colors.adminPrimary },
  cardTitle: { fontWeight: '800', color: Colors.text, fontSize: 15 },
  cardMeta: { color: Colors.textMuted, fontSize: 12, marginTop: 3 },
  badge: { alignSelf: 'flex-start', backgroundColor: Colors.adminPrimary + '14', color: Colors.adminPrimary, fontWeight: '800', fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, marginTop: 8, borderRadius: 6 },
  message: { color: Colors.textSecondary, marginTop: 8, lineHeight: 19 },
  detailTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  detailTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  detailMeta: { color: Colors.textMuted, marginTop: 3 },
  assign: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.adminPrimary, borderRadius: 8, padding: 10 },
  assignText: { color: Colors.adminPrimary, fontWeight: '800' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 16 },
  status: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.surfaceAlt },
  statusActive: { backgroundColor: Colors.adminPrimary },
  statusText: { color: Colors.textSecondary, fontWeight: '700' },
  statusTextActive: { color: '#FFFFFF' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginTop: 16, marginBottom: 8 },
  panelText: { backgroundColor: Colors.surface, borderRadius: 8, padding: 14, color: Colors.text, lineHeight: 21 },
  template: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, marginBottom: 8 },
  templateTitle: { fontWeight: '800', color: Colors.text },
  templateScenario: { color: Colors.textMuted, fontSize: 12, marginTop: 3 },
  replyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aiButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.adminPrimary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  aiText: { color: '#FFFFFF', fontWeight: '800' },
  reply: { minHeight: 140, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, textAlignVertical: 'top', color: Colors.text },
  send: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.success, borderRadius: 8, padding: 14, marginTop: 10 },
  sendText: { color: '#FFFFFF', fontWeight: '800' },
  history: { flexDirection: 'row', gap: 8, backgroundColor: Colors.surface, borderRadius: 8, padding: 12, marginBottom: 8 },
  historyText: { flex: 1, color: Colors.textSecondary },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: 32 },
});
