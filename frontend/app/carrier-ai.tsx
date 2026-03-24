import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Brain,
  Send,
  Truck,
  Clock,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Briefcase,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCarrier } from '@/providers/CarrierProvider';

const MOCK_CARRIER_PERFORMANCE = [
  { month: 'Oct', slaCompliance: 96, onTimePercent: 94, revenue: 14200, avgRating: 4.7, jobsCompleted: 142 },
  { month: 'Nov', slaCompliance: 94, onTimePercent: 92, revenue: 13800, avgRating: 4.6, jobsCompleted: 135 },
  { month: 'Dec', slaCompliance: 98, onTimePercent: 97, revenue: 16500, avgRating: 4.9, jobsCompleted: 184 },
];

const MOCK_CARRIER_EARNINGS = {
  totalRevenue: 44500,
  paidOut: 38200,
  pendingPayment: 6300,
  period: 'Last 3 Months',
  completedJobs: 461,
  avgPerJob: 96.50,
};

const MOCK_CARRIER_DELAY_BREAKDOWN = [
  { reason: 'Traffic / Weather', count: 18, avgDelayMins: 35, routes: ['A465', 'M4 East'] },
  { reason: 'Customer Unavailable', count: 12, avgDelayMins: 15, routes: ['City Centre'] },
  { reason: 'Vehicle Issue', count: 3, avgDelayMins: 85, routes: ['Rural'] },
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  { label: 'Late deliveries last month', icon: Clock, query: 'Show my late deliveries last month' },
  { label: 'Routes causing delays', icon: MapPin, query: 'Which routes are causing delays?' },
  { label: 'Average SLA score', icon: TrendingUp, query: 'What is my average SLA score?' },
  { label: 'Revenue breakdown', icon: Briefcase, query: 'Show my revenue breakdown' },
  { label: 'Fleet status', icon: Truck, query: 'What is the status of my fleet?' },
  { label: 'At-risk jobs', icon: AlertTriangle, query: 'Are there any at-risk jobs right now?' },
];

function generateResponse(query: string, carrierData: { assignedJobs: any[]; completedJobs: any[]; fleet: any[]; activeFleet: any[] }): string {
  const lower = query.toLowerCase();
  const perf = MOCK_CARRIER_PERFORMANCE;
  const earnings = MOCK_CARRIER_EARNINGS;
  const delays = MOCK_CARRIER_DELAY_BREAKDOWN;
  const latest = perf[perf.length - 1];

  if (lower.includes('late') || lower.includes('delay')) {
    const totalDelays = delays.reduce((a: number, b: any) => a + b.count, 0);
    const topReason = delays[0];
    return `In the last month, you had ${totalDelays} delay incidents across all routes.\n\nTop cause: ${topReason.reason} (${topReason.count} incidents, avg ${topReason.avgDelayMins} mins)\n\nAffected routes:\n${delays.map((d: any) => `• ${d.reason}: ${d.routes.join(', ')}`).join('\n')}\n\nRecommendation: Consider adjusting departure times on the ${topReason.routes[0]} route to avoid peak congestion.`;
  }

  if (lower.includes('route') && lower.includes('delay')) {
    return `Routes with the most delays:\n\n${delays.map((d: any) => `• ${d.routes.join(', ')}\n  Cause: ${d.reason} · ${d.count} incidents · Avg delay: ${d.avgDelayMins} mins`).join('\n\n')}\n\nThe Swansea → Cardiff route has the highest delay frequency due to traffic congestion between 08:00-09:00.`;
  }

  if (lower.includes('sla')) {
    const avgSla = perf.reduce((a: number, b: any) => a + b.slaCompliance, 0) / perf.length;
    return `Your current SLA compliance is ${latest.slaCompliance}% (February 2026).\n\n6-month average: ${avgSla.toFixed(1)}%\n\nMonthly breakdown:\n${perf.map((p: any) => `• ${p.month}: ${p.slaCompliance}%`).join('\n')}\n\nYour SLA performance has been trending upward since December. Keep it up!`;
  }

  if (lower.includes('revenue') || lower.includes('earning')) {
    return `Revenue Summary (${earnings.period}):\n\n• Total Revenue: £${earnings.totalRevenue.toLocaleString()}\n• Paid Out: £${earnings.paidOut.toLocaleString()}\n• Pending: £${earnings.pendingPayment.toLocaleString()}\n• Completed Jobs: ${earnings.completedJobs}\n• Avg per Job: £${earnings.avgPerJob.toFixed(2)}\n\nRevenue is up 11% compared to last month. Your HGV routes are the highest earners at an average of £340 per job.`;
  }

  if (lower.includes('fleet') || lower.includes('vehicle')) {
    const active = carrierData.activeFleet.length;
    const total = carrierData.fleet.length;
    return `Fleet Status:\n\n• Total Vehicles: ${total}\n• Active: ${active}\n• In Maintenance: ${carrierData.fleet.filter((v: any) => v.status === 'MAINTENANCE').length}\n• Offline: ${carrierData.fleet.filter((v: any) => v.status === 'OFFLINE').length}\n\nFleet utilisation rate: ${((active / total) * 100).toFixed(0)}%\n\nNote: CY21 VAN is currently in maintenance. Consider scheduling maintenance during off-peak periods to maximise fleet availability.`;
  }

  if (lower.includes('risk') || lower.includes('at-risk')) {
    const atRisk = carrierData.assignedJobs.filter((j: any) => j.slaStatus === 'AT_RISK');
    if (atRisk.length === 0) {
      return 'Good news! There are no at-risk jobs currently. All assigned jobs are on track for SLA compliance.';
    }
    return `You have ${atRisk.length} job(s) at risk:\n\n${atRisk.map((j: any) => `• ${j.jobNumber}: ${j.pickupCity} → ${j.dropoffCity}\n  Vehicle: ${j.vehicleType} · SLA Status: AT RISK`).join('\n\n')}\n\nRecommendation: Prioritise these deliveries and consider reassigning if needed.`;
  }

  return `Here's a quick overview of your operations:\n\n• Active Jobs: ${carrierData.assignedJobs.length}\n• Completed This Month: ${latest.jobsCompleted}\n• SLA Compliance: ${latest.slaCompliance}%\n• On-Time Rate: ${latest.onTimePercent}%\n• Revenue: £${earnings.totalRevenue.toLocaleString()}\n• Fleet Utilisation: ${((carrierData.activeFleet.length / carrierData.fleet.length) * 100).toFixed(0)}%\n\nIs there anything specific you'd like to know more about?`;
}

export default function CarrierAIScreen() {
  const carrier = useCarrier();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const typingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(typingAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      typingAnim.setValue(0);
    }
  }, [isTyping, typingAnim]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setTimeout(() => {
      const response = generateResponse(text, carrier);
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1200);
  }, [carrier]);

  const handleQuickPrompt = useCallback((query: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendMessage(query);
  }, [sendMessage]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: 'AI Assistant' }} />

      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && (
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeIcon}>
              <Brain size={36} color={Colors.carrierPrimary} />
            </View>
            <Text style={styles.welcomeTitle}>Carrier AI Assistant</Text>
            <Text style={styles.welcomeSub}>
              Ask me about your deliveries, performance, routes, or fleet. I have access to all your operational data.
            </Text>

            <Text style={styles.promptsTitle}>Quick actions</Text>
            <View style={styles.promptsGrid}>
              {QUICK_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt.label}
                  style={styles.promptCard}
                  onPress={() => handleQuickPrompt(prompt.query)}
                  activeOpacity={0.7}
                >
                  <prompt.icon size={16} color={Colors.carrierPrimary} />
                  <Text style={styles.promptLabel}>{prompt.label}</Text>
                  <ChevronRight size={14} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            {msg.role === 'assistant' && (
              <View style={styles.aiAvatarSmall}>
                <Brain size={12} color={Colors.carrierPrimary} />
              </View>
            )}
            <Text style={[
              styles.messageText,
              msg.role === 'user' ? styles.userText : styles.aiText,
            ]}>
              {msg.content}
            </Text>
          </View>
        ))}

        {isTyping && (
          <Animated.View style={[styles.typingIndicator, { opacity: typingAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }]}>
            <View style={styles.aiAvatarSmall}>
              <Brain size={12} color={Colors.carrierPrimary} />
            </View>
            <Text style={styles.typingText}>Analysing your data...</Text>
          </Animated.View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      {messages.length > 0 && (
        <View style={styles.quickActionsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsContent}>
            {QUICK_PROMPTS.slice(0, 4).map((prompt) => (
              <TouchableOpacity
                key={prompt.label}
                style={styles.quickChip}
                onPress={() => handleQuickPrompt(prompt.query)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickChipText}>{prompt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your operations..."
          placeholderTextColor={Colors.textMuted}
          multiline
          returnKeyType="send"
          onSubmitEditing={() => sendMessage(input)}
          blurOnSubmit
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim()}
          activeOpacity={0.7}
        >
          <Send size={18} color={input.trim() ? '#FFFFFF' : Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 8,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.carrierPrimary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  welcomeSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  promptsTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    alignSelf: 'flex-start',
    marginBottom: 10,
    width: '100%',
  },
  promptsGrid: {
    width: '100%',
    gap: 6,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  promptLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.carrierPrimary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: Colors.text,
  },
  aiAvatarSmall: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: Colors.carrierPrimary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typingText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
  },
  quickActionsRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  quickActionsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  quickChip: {
    backgroundColor: Colors.carrierPrimary + '10',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.carrierPrimary + '20',
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.carrierPrimary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.carrierPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.surfaceAlt,
  },
});
