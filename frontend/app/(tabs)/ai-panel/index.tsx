import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Brain,
  Target,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  Clock,
  Truck,
  ChevronRight,
  Zap,
  MessageSquare,
  Send,
  XCircle,
  Info,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';
import { AIDispatchSuggestion, AISLARiskPrediction, AIAnomalyAlert } from '@/types';

type AITab = 'dispatch' | 'sla' | 'anomalies' | 'assistant';

function getRiskStyle(level: string) {
  switch (level) {
    case 'LOW': return { color: Colors.success, bg: Colors.successLight };
    case 'MEDIUM': return { color: Colors.warning, bg: Colors.warningLight };
    case 'HIGH': return { color: Colors.danger, bg: Colors.dangerLight };
    case 'CRITICAL': return { color: '#991B1B', bg: '#FEE2E2' };
    default: return { color: Colors.textMuted, bg: '#F1F5F9' };
  }
}

function getSeverityStyle(sev: string) {
  switch (sev) {
    case 'INFO': return { color: Colors.info, bg: Colors.infoLight, Icon: Info };
    case 'WARNING': return { color: Colors.warning, bg: Colors.warningLight, Icon: AlertTriangle };
    case 'CRITICAL': return { color: Colors.danger, bg: Colors.dangerLight, Icon: ShieldAlert };
    default: return { color: Colors.textMuted, bg: '#F1F5F9', Icon: Info };
  }
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

const MOCK_ASSISTANT_RESPONSES: Record<string, string> = {
  'sla': '📊 SLA Performance Summary (February 2026):\n\nOverall SLA Compliance: 94.2%\n\nBreaches this month: 8\n- 3 on Carmarthen → Haverfordwest route\n- 2 on Swansea → Cardiff (Friday PM)\n- 3 other routes\n\nTop performer: Iwan Davies (97.8%)\nLowest: Gethin Thomas (91.4%)\n\nRecommendation: Review A40 roadworks impact and Friday PM scheduling.',
  'overdue': '💰 Overdue Invoices:\n\n1. CYV-INV-2025-0412 - £875.00\n   Client: TechWorks Ltd\n   Due: 15 Jan 2026 (37 days overdue)\n\nTotal Overdue: £875.00\nTotal Pending: £1,245.00\n\nAction: Send payment reminder to TechWorks Ltd accounts team.',
  'routes': '🗺️ Route Analysis - Swansea Area:\n\nMost delayed routes:\n1. Carmarthen → Haverfordwest: avg 22min delay (A40 roadworks)\n2. M4 J43 Swansea: avg 18min delay (peak traffic)\n\nMost profitable:\n1. Swansea → Cardiff: £145 avg, 234 jobs\n2. Carmarthen → Haverfordwest: £165 avg, 89 jobs\n\nSuggestion: Reroute Carmarthen jobs via A477.',
  'default': '🤖 I can help you with:\n\n• "Show SLA breaches last month"\n• "Which routes cause delays?"\n• "What invoices are overdue?"\n• "Summarise client performance"\n• "Compare carrier rates"\n\nPlease try one of these queries or ask about any operational topic.',
};

export default function AIPanelScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AITab>('dispatch');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const [dispatchData, setDispatchData] = useState<any[]>([]);
  const [slaData, setSlaData] = useState<any[]>([]);
  const [anomalyData, setAnomalyData] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [dispatchRes, slaRes, anomalyRes] = await Promise.all([
        apiClient('/ai/dispatch-suggestions'),
        apiClient('/ai/sla-risks'),
        apiClient('/ai/anomalies')
      ]);
      setDispatchData(dispatchRes.suggestions || []);
      setSlaData(slaRes.risks || []);
      setAnomalyData(anomalyRes.anomalies || []);
    } catch (e) {
      console.error('Failed to load AI parameters:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const handleAcceptSuggestion = useCallback((suggestion: AIDispatchSuggestion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Accept AI Suggestion',
      `Assign ${suggestion.jobNumber} to ${suggestion.suggestedAssignee}?\n\nConfidence: ${suggestion.confidence}%\nETA: ${suggestion.estimatedETA}\nSLA Risk: ${suggestion.slaRisk}`,
      [
        { text: 'Assign', onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); Alert.alert('Assigned', `Job assigned to ${suggestion.suggestedAssignee}`); } },
        { text: 'Modify', onPress: () => Alert.alert('Modify', 'Choose a different assignee') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, []);

  const handleAcknowledgeAnomaly = useCallback((alert: AIAnomalyAlert) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      alert.title,
      `${alert.description}\n\nSuggested Action:\n${alert.suggestedAction}`,
      [
        { text: 'Acknowledge', onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } },
        { text: 'Take Action', onPress: () => Alert.alert('Action', 'Routing to relevant module...') },
        { text: 'Dismiss', style: 'cancel' },
      ]
    );
  }, []);

  const handleAskAssistant = useCallback(async () => {
    if (!assistantQuery.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsThinking(true);

    try {
      const res = await apiClient('/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: assistantQuery })
      });
      setAssistantResponse(res.response);
    } catch (error) {
      console.error(error);
      setAssistantResponse('Sorry, I encountered an error communicating with the AI.');
    } finally {
      setIsThinking(false);
      setAssistantQuery('');
    }
  }, [assistantQuery]);

  const unacknowledgedCount = anomalyData.filter((a: any) => !a.acknowledged).length;

  const MOCK_AI_DISPATCH_SUGGESTIONS = dispatchData;
  const MOCK_SLA_RISK_PREDICTIONS = slaData;
  const MOCK_ANOMALY_ALERTS = anomalyData;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.adminPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>AI Control Panel</Text>
            <Text style={styles.headerSubtitle}>Dispatch suggestions, predictions & insights</Text>
          </View>
          <View style={styles.headerIcon}>
            <Brain size={20} color={Colors.adminPrimary} />
          </View>
        </View>

        <View style={styles.tabRow}>
          {([
            { key: 'dispatch' as AITab, label: 'Dispatch' },
            { key: 'sla' as AITab, label: 'SLA Risk' },
            { key: 'anomalies' as AITab, label: `Alerts${unacknowledgedCount > 0 ? ` (${unacknowledgedCount})` : ''}` },
            { key: 'assistant' as AITab, label: 'Assistant' },
          ]).map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => { setActiveTab(tab.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.adminPrimary} />}
      >
        {activeTab === 'dispatch' && (
          <>
            <View style={styles.aiInfoBanner}>
              <Zap size={16} color={Colors.warning} />
              <Text style={styles.aiInfoText}>AI has analysed {MOCK_AI_DISPATCH_SUGGESTIONS.length} pending jobs and suggests optimal assignments</Text>
            </View>

            {MOCK_AI_DISPATCH_SUGGESTIONS.map((sug: any) => {
              const riskStyle = getRiskStyle(sug.slaRisk);
              return (
                <View key={sug.id} style={styles.suggestionCard}>
                  <View style={styles.sugTop}>
                    <View style={styles.sugJobInfo}>
                      <Text style={styles.sugJobNumber}>{sug.jobNumber}</Text>
                      <Text style={styles.sugRoute}>{sug.pickupCity} → {sug.dropoffCity}</Text>
                    </View>
                    <View style={styles.confidenceWrap}>
                      <Text style={styles.confidenceValue}>{sug.confidence}%</Text>
                      <Text style={styles.confidenceLabel}>confidence</Text>
                    </View>
                  </View>

                  <View style={styles.sugAssignee}>
                    <View style={styles.sugAssigneeIcon}>
                      {sug.assigneeType === 'driver' ? <Truck size={14} color={Colors.primary} /> : <Truck size={14} color={Colors.carrierPrimary} />}
                    </View>
                    <View style={styles.sugAssigneeInfo}>
                      <Text style={styles.sugAssigneeName}>{sug.suggestedAssignee}</Text>
                      <Text style={styles.sugAssigneeType}>{sug.assigneeType === 'driver' ? 'Internal Driver' : 'External Carrier'}</Text>
                    </View>
                    <View style={styles.sugEtaWrap}>
                      <Text style={styles.sugEta}>ETA {sug.estimatedETA}</Text>
                      <View style={[styles.riskBadge, { backgroundColor: riskStyle.bg }]}>
                        <Text style={[styles.riskText, { color: riskStyle.color }]}>{sug.slaRisk} risk</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.reasonsWrap}>
                    {sug.reasons.map((reason: any, i: any) => (
                      <View key={i} style={styles.reasonRow}>
                        <CheckCircle size={10} color={Colors.success} />
                        <Text style={styles.reasonText}>{reason}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAcceptSuggestion(sug)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.acceptBtnText}>Accept & Assign</Text>
                    <ChevronRight size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {activeTab === 'sla' && (
          <>
            <View style={styles.riskSummary}>
              <View style={[styles.riskSumCard, { borderLeftColor: Colors.danger }]}>
                <Text style={styles.riskSumValue}>{MOCK_SLA_RISK_PREDICTIONS.filter((p: any) => p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH').length}</Text>
                <Text style={styles.riskSumLabel}>High Risk</Text>
              </View>
              <View style={[styles.riskSumCard, { borderLeftColor: Colors.warning }]}>
                <Text style={styles.riskSumValue}>{MOCK_SLA_RISK_PREDICTIONS.filter((p: any) => p.riskLevel === 'MEDIUM').length}</Text>
                <Text style={styles.riskSumLabel}>Medium</Text>
              </View>
              <View style={[styles.riskSumCard, { borderLeftColor: Colors.success }]}>
                <Text style={styles.riskSumValue}>{MOCK_SLA_RISK_PREDICTIONS.filter((p: any) => p.riskLevel === 'LOW').length}</Text>
                <Text style={styles.riskSumLabel}>Low Risk</Text>
              </View>
            </View>

            {MOCK_SLA_RISK_PREDICTIONS.sort((a: any, b: any) => b.riskScore - a.riskScore).map((pred: any) => {
              const riskStyle = getRiskStyle(pred.riskLevel);
              return (
                <View key={pred.id} style={[styles.predCard, { borderLeftColor: riskStyle.color, borderLeftWidth: 3 }]}>
                  <View style={styles.predTop}>
                    <View>
                      <Text style={styles.predJobNumber}>{pred.jobNumber}</Text>
                      <Text style={styles.predRoute}>{pred.route}</Text>
                      <Text style={styles.predBusiness}>{pred.businessName}</Text>
                    </View>
                    <View style={styles.predRiskWrap}>
                      <View style={[styles.riskScoreBadge, { backgroundColor: riskStyle.bg }]}>
                        <Text style={[styles.riskScoreText, { color: riskStyle.color }]}>{pred.riskScore}</Text>
                      </View>
                      <Text style={[styles.predRiskLabel, { color: riskStyle.color }]}>{pred.riskLevel}</Text>
                    </View>
                  </View>

                  {pred.predictedDelay > 0 && (
                    <View style={styles.delayBanner}>
                      <Clock size={12} color={Colors.danger} />
                      <Text style={styles.delayText}>Predicted delay: {pred.predictedDelay} min</Text>
                    </View>
                  )}

                  <View style={styles.predReasons}>
                    {pred.reasons.map((reason: any, i: any) => (
                      <View key={i} style={styles.predReasonRow}>
                        <AlertTriangle size={10} color={Colors.warning} />
                        <Text style={styles.predReasonText}>{reason}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.predAction}>
                    <Text style={styles.predActionLabel}>Suggested: </Text>
                    <Text style={styles.predActionText}>{pred.suggestedAction}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {activeTab === 'anomalies' && (
          <>
            {MOCK_ANOMALY_ALERTS.map((anomaly: any) => {
              const sevStyle = getSeverityStyle(anomaly.severity);
              const SevIcon = sevStyle.Icon;
              return (
                <TouchableOpacity
                  key={anomaly.id}
                  style={[styles.anomalyCard, anomaly.acknowledged && styles.anomalyAcknowledged]}
                  onPress={() => handleAcknowledgeAnomaly(anomaly)}
                  activeOpacity={0.7}
                >
                  <View style={styles.anomalyTop}>
                    <View style={[styles.sevIconWrap, { backgroundColor: sevStyle.bg }]}>
                      <SevIcon size={14} color={sevStyle.color} />
                    </View>
                    <View style={styles.anomalyInfo}>
                      <Text style={styles.anomalyTitle}>{anomaly.title}</Text>
                      <Text style={styles.anomalyType}>{anomaly.type.replace(/_/g, ' ')} · {timeAgo(anomaly.detectedAt)}</Text>
                    </View>
                    {!anomaly.acknowledged && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>
                  <Text style={styles.anomalyDesc} numberOfLines={2}>{anomaly.description}</Text>
                  <View style={styles.anomalyBottom}>
                    <Text style={styles.anomalyEntity}>{anomaly.affectedEntity}</Text>
                    <View style={[styles.sevBadge, { backgroundColor: sevStyle.bg }]}>
                      <Text style={[styles.sevText, { color: sevStyle.color }]}>{anomaly.severity}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {activeTab === 'assistant' && (
          <>
            <View style={styles.assistantHero}>
              <Brain size={28} color={Colors.adminPrimary} />
              <Text style={styles.assistantTitle}>AI Assistant</Text>
              <Text style={styles.assistantSubtitle}>Ask questions about your operations data</Text>
            </View>

            <View style={styles.quickQueries}>
              {['Show SLA breaches', 'Overdue invoices', 'Delay routes in Swansea'].map((q, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.quickQuery}
                  onPress={() => { setAssistantQuery(q); }}
                  activeOpacity={0.7}
                >
                  <MessageSquare size={12} color={Colors.adminPrimary} />
                  <Text style={styles.quickQueryText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.queryInput}
                placeholder="Ask about SLA, invoices, routes..."
                placeholderTextColor={Colors.textMuted}
                value={assistantQuery}
                onChangeText={setAssistantQuery}
                onSubmitEditing={handleAskAssistant}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.sendBtn, !assistantQuery.trim() && styles.sendBtnDisabled]}
                onPress={handleAskAssistant}
                disabled={!assistantQuery.trim() || isThinking}
                activeOpacity={0.7}
              >
                <Send size={16} color={!assistantQuery.trim() ? Colors.textMuted : '#FFFFFF'} />
              </TouchableOpacity>
            </View>

            {isThinking && (
              <View style={styles.thinkingWrap}>
                <Brain size={16} color={Colors.adminPrimary} />
                <Text style={styles.thinkingText}>Analysing your data...</Text>
              </View>
            )}

            {assistantResponse !== '' && !isThinking && (
              <View style={styles.responseCard}>
                <View style={styles.responseHeader}>
                  <Brain size={14} color={Colors.adminPrimary} />
                  <Text style={styles.responseHeaderText}>AI Response</Text>
                </View>
                <Text style={styles.responseText}>{assistantResponse}</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800' as const, color: Colors.textInverse },
  headerSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.adminPrimary + '18', alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', backgroundColor: Colors.navyLight, borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: Colors.adminPrimary },
  tabText: { fontSize: 11, fontWeight: '600' as const, color: Colors.textMuted },
  tabTextActive: { color: Colors.textInverse },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  aiInfoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.warningLight, borderRadius: 10, padding: 12, marginBottom: 16, gap: 8 },
  aiInfoText: { fontSize: 12, color: '#92400E', flex: 1, lineHeight: 17 },
  suggestionCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  sugTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  sugJobInfo: {},
  sugJobNumber: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  sugRoute: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  confidenceWrap: { alignItems: 'center' },
  confidenceValue: { fontSize: 22, fontWeight: '800' as const, color: Colors.success },
  confidenceLabel: { fontSize: 9, color: Colors.textMuted },
  sugAssignee: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceAlt, borderRadius: 10, padding: 10, marginBottom: 10, gap: 10 },
  sugAssigneeIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  sugAssigneeInfo: { flex: 1 },
  sugAssigneeName: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  sugAssigneeType: { fontSize: 11, color: Colors.textMuted },
  sugEtaWrap: { alignItems: 'flex-end', gap: 4 },
  sugEta: { fontSize: 12, fontWeight: '600' as const, color: Colors.text },
  riskBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  riskText: { fontSize: 9, fontWeight: '700' as const },
  reasonsWrap: { marginBottom: 12, gap: 4 },
  reasonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  reasonText: { fontSize: 12, color: Colors.textSecondary, flex: 1, lineHeight: 17 },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.adminPrimary, borderRadius: 10, paddingVertical: 10, gap: 6 },
  acceptBtnText: { fontSize: 14, fontWeight: '700' as const, color: '#FFFFFF' },
  riskSummary: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  riskSumCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 3, alignItems: 'center' },
  riskSumValue: { fontSize: 20, fontWeight: '800' as const, color: Colors.text },
  riskSumLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  predCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  predTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  predJobNumber: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  predRoute: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  predBusiness: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  predRiskWrap: { alignItems: 'center', gap: 4 },
  riskScoreBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  riskScoreText: { fontSize: 16, fontWeight: '800' as const },
  predRiskLabel: { fontSize: 10, fontWeight: '700' as const },
  delayBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dangerLight, borderRadius: 8, padding: 8, marginBottom: 10, gap: 6 },
  delayText: { fontSize: 12, fontWeight: '600' as const, color: Colors.danger },
  predReasons: { marginBottom: 10, gap: 4 },
  predReasonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  predReasonText: { fontSize: 12, color: Colors.textSecondary, flex: 1, lineHeight: 17 },
  predAction: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  predActionLabel: { fontSize: 11, fontWeight: '600' as const, color: Colors.info },
  predActionText: { fontSize: 11, color: Colors.textSecondary, flex: 1, lineHeight: 17 },
  anomalyCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  anomalyAcknowledged: { opacity: 0.7 },
  anomalyTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  sevIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  anomalyInfo: { flex: 1 },
  anomalyTitle: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  anomalyType: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger, marginTop: 4 },
  anomalyDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginBottom: 10 },
  anomalyBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  anomalyEntity: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' as const },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  sevText: { fontSize: 10, fontWeight: '700' as const },
  assistantHero: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  assistantTitle: { fontSize: 20, fontWeight: '800' as const, color: Colors.text },
  assistantSubtitle: { fontSize: 13, color: Colors.textSecondary },
  quickQueries: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  quickQuery: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  quickQueryText: { fontSize: 12, color: Colors.text, fontWeight: '500' as const },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  queryInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border, fontSize: 14, color: Colors.text },
  sendBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.adminPrimary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border },
  thinkingWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
  thinkingText: { fontSize: 14, color: Colors.adminPrimary, fontWeight: '500' as const },
  responseCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.adminPrimary + '30' },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  responseHeaderText: { fontSize: 13, fontWeight: '700' as const, color: Colors.adminPrimary },
  responseText: { fontSize: 13, color: Colors.text, lineHeight: 20 },
});
