import React, { useState, useCallback, useRef } from 'react';
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
  Sparkles,
  TrendingUp,
  Receipt,
  MapPin,
  Shield,
  Lightbulb,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const MOCK_AI_SUMMARY = {
  monthlySummary: 'Your deliveries are running smoothly. 96.5% of jobs met SLA targets this month, with an average cost per route of £42 - down 5% from last month.',
  suggestions: [
    'Consolidate Tuesday shipments to Cardiff to save ~12%',
    'Use electric vans for city-center drops to boost green rating',
    'Pre-approve driver overtime for upcoming bank holiday weekend'
  ]
};

const MOCK_CUSTOMER_ANALYTICS = {
  slaByMonth: [{ month: 'Oct', compliance: 95, target: 92 }, { month: 'Nov', compliance: 93.2, target: 92 }, { month: 'Dec', compliance: 97.1, target: 92 }],
  costByRoute: [{ route: 'Swansea → Cardiff', avgCost: 145.50, trips: 24 }],
  emissionsMonthly: [{ month: 'Oct', kgCO2: 120 }, { month: 'Nov', kgCO2: 110 }, { month: 'Dec', kgCO2: 105 }]
};

const MOCK_BUSINESS_PROFILE = {
  companyName: 'Sample Business',
  slaCompliance: 96,
  totalJobs: 142,
  totalSpend: 15400,
  currentBalance: 1250
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  { icon: Shield, text: 'Show my SLA performance', color: Colors.customerPrimary },
  { icon: MapPin, text: 'Which routes cost the most?', color: Colors.warning },
  { icon: Receipt, text: 'What invoices are unpaid?', color: Colors.danger },
  { icon: TrendingUp, text: 'Summarise this month\'s performance', color: Colors.success },
];

function generateAIResponse(query: string): string {
  const q = query.toLowerCase();
  const profile = MOCK_BUSINESS_PROFILE;
  const analytics = MOCK_CUSTOMER_ANALYTICS;

  if (q.includes('sla') || q.includes('performance') || q.includes('compliance')) {
    const latest = analytics.slaByMonth[analytics.slaByMonth.length - 1];
    return `Your current SLA compliance is ${latest.compliance}% (target: ${latest.target}%). Over the last 6 months:\n\n${analytics.slaByMonth.map((m: any) => `• ${m.month}: ${m.compliance}%${m.compliance >= m.target ? ' ✓' : ' ⚠'}`).join('\n')}\n\nYou're performing above the platform average of 91.5%. Your best month was December at 97.1%. November was slightly below target at 93.2% — this was likely due to seasonal delays on the Swansea-Cardiff corridor.`;
  }

  if (q.includes('route') || q.includes('cost') || q.includes('expensive')) {
    return `Here are your top routes by cost:\n\n${analytics.costByRoute.slice(0, 5).map((r: any, i: number) => `${i + 1}. ${r.route} — £${r.avgCost.toFixed(2)} avg (${r.trips} trips)`).join('\n')}\n\nThe Swansea → Cardiff route is your most expensive at £145.50 average. Consider consolidating Tuesday/Thursday shipments to reduce per-unit costs by ~12%.`;
  }

  if (q.includes('invoice') || q.includes('unpaid') || q.includes('overdue') || q.includes('payment')) {
    return `You have 2 outstanding invoices:\n\n• CYV-INV-2026-0087 — £1,245.00 (Due: 15 Mar 2026) — Pending\n• CYV-INV-2025-0412 — £875.00 (Due: 15 Jan 2026) — OVERDUE\n\nTotal outstanding: £2,120.00\nTotal overdue: £875.00\n\nThe December invoice (£875.00) is now 37 days overdue. Please arrange payment to avoid any service disruptions.`;
  }

  if (q.includes('summar') || q.includes('month') || q.includes('overview')) {
    return MOCK_AI_SUMMARY.monthlySummary;
  }

  if (q.includes('emission') || q.includes('carbon') || q.includes('green') || q.includes('sustain')) {
    const total = analytics.emissionsMonthly.reduce((s, d) => s + d.kgCO2, 0);
    return `Your carbon footprint over the last 6 months:\n\nTotal: ${total.toLocaleString()} kg CO₂\n\n${analytics.emissionsMonthly.map((m: any) => `• ${m.month}: ${m.kgCO2} kg`).join('\n')}\n\nEmissions are trending 4.3% lower than the previous period. Route optimisation and carrier selection improvements have contributed to this reduction.`;
  }

  if (q.includes('suggest') || q.includes('improve') || q.includes('optimis') || q.includes('save')) {
    return `Here are my suggestions to improve your operations:\n\n${MOCK_AI_SUMMARY.suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n\n')}\n\nWould you like me to elaborate on any of these?`;
  }

  return `Based on your account data for ${profile.companyName}:\n\n• SLA Compliance: ${profile.slaCompliance}%\n• Total Jobs: ${profile.totalJobs}\n• Total Spend: £${profile.totalSpend.toLocaleString()}\n• Current Balance: £${profile.currentBalance.toLocaleString()}\n\nI can help you with SLA performance analysis, route cost breakdowns, invoice queries, emissions tracking, and optimisation suggestions. What would you like to know more about?`;
}

export default function CustomerAIScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const typingAnim = useRef(new Animated.Value(0)).current;

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(typingAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    setTimeout(() => {
      const response = generateAIResponse(text);
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        text: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
      typingAnim.stopAnimation();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1200 + Math.random() * 800);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [typingAnim]);

  const handleSuggestion = useCallback((text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendMessage(text);
  }, [sendMessage]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'AI Assistant',
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={90}>
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={styles.welcomeSection}>
              <View style={styles.aiIconWrap}>
                <Brain size={32} color={Colors.customerPrimary} />
              </View>
              <Text style={styles.welcomeTitle}>CYVhub AI Assistant</Text>
              <Text style={styles.welcomeSubtitle}>
                Ask me about your SLA performance, delivery costs, invoices, emissions, or anything about your account.
              </Text>

              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Sparkles size={14} color={Colors.customerPrimary} />
                  <Text style={styles.summaryTitle}>AI Monthly Summary</Text>
                </View>
                <Text style={styles.summaryText}>{MOCK_AI_SUMMARY.monthlySummary}</Text>
              </View>

              <View style={styles.suggestionsSection}>
                <View style={styles.suggestionsHeader}>
                  <Lightbulb size={14} color={Colors.warning} />
                  <Text style={styles.suggestionsTitle}>AI Suggestions</Text>
                </View>
                {MOCK_AI_SUMMARY.suggestions.map((s: string, i: number) => (
                  <View key={i} style={styles.suggestionItem}>
                    <View style={styles.suggestionDot} />
                    <Text style={styles.suggestionText}>{s}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.quickQuestionsLabel}>Quick questions</Text>
              <View style={styles.quickQuestions}>
                {SUGGESTED_QUESTIONS.map((q, i) => {
                  const Icon = q.icon;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={styles.quickQuestion}
                      onPress={() => handleSuggestion(q.text)}
                      activeOpacity={0.7}
                    >
                      <Icon size={14} color={q.color} />
                      <Text style={styles.quickQuestionText}>{q.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {messages.map(msg => (
            <View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              {msg.role === 'assistant' && (
                <View style={styles.aiMsgHeader}>
                  <Brain size={12} color={Colors.customerPrimary} />
                  <Text style={styles.aiMsgLabel}>AI Assistant</Text>
                </View>
              )}
              <Text style={[styles.messageText, msg.role === 'user' && styles.userMessageText]}>{msg.text}</Text>
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <View style={styles.aiMsgHeader}>
                <Brain size={12} color={Colors.customerPrimary} />
                <Text style={styles.aiMsgLabel}>AI Assistant</Text>
              </View>
              <Animated.View style={[styles.typingDots, { opacity: typingAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }]}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </Animated.View>
            </View>
          )}

          {messages.length > 0 && !isTyping && (
            <View style={styles.followUpSection}>
              {SUGGESTED_QUESTIONS.slice(0, 2).map((q, i) => (
                <TouchableOpacity key={i} style={styles.followUpChip} onPress={() => handleSuggestion(q.text)}>
                  <Text style={styles.followUpText}>{q.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ height: 16 }} />
        </ScrollView>

        <View style={styles.inputBar}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask about your deliveries..."
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(inputText)}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isTyping}
              activeOpacity={0.7}
            >
              <Send size={18} color={inputText.trim() ? '#FFFFFF' : Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  chatArea: { flex: 1 },
  chatContent: { padding: 16 },
  welcomeSection: { alignItems: 'center' },
  aiIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#CCFBF1', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  welcomeTitle: { fontSize: 22, fontWeight: '800' as const, color: Colors.text, marginBottom: 8 },
  welcomeSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' as const, lineHeight: 20, marginBottom: 20, paddingHorizontal: 20 },
  summaryCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, width: '100%', marginBottom: 16 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  summaryTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.customerPrimary },
  summaryText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  suggestionsSection: { backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#FDE68A', width: '100%', marginBottom: 20 },
  suggestionsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  suggestionsTitle: { fontSize: 14, fontWeight: '700' as const, color: '#92400E' },
  suggestionItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  suggestionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.warning, marginTop: 6 },
  suggestionText: { fontSize: 13, color: '#78350F', lineHeight: 18, flex: 1 },
  quickQuestionsLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.textMuted, marginBottom: 10, alignSelf: 'flex-start' as const },
  quickQuestions: { width: '100%', gap: 8 },
  quickQuestion: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  quickQuestionText: { fontSize: 14, fontWeight: '500' as const, color: Colors.text },
  messageBubble: { maxWidth: '85%', borderRadius: 16, padding: 14, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end' as const, backgroundColor: Colors.customerPrimary, borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start' as const, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  aiMsgHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  aiMsgLabel: { fontSize: 10, fontWeight: '700' as const, color: Colors.customerPrimary },
  messageText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  userMessageText: { color: '#FFFFFF' },
  typingDots: { flexDirection: 'row', gap: 6, paddingVertical: 4 },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.customerPrimary },
  followUpSection: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  followUpChip: { backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.customerPrimary + '40' },
  followUpText: { fontSize: 12, fontWeight: '500' as const, color: Colors.customerPrimary },
  inputBar: { backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, padding: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: Colors.surfaceAlt, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingLeft: 14, paddingRight: 4, paddingVertical: 4 },
  input: { flex: 1, fontSize: 14, color: Colors.text, maxHeight: 100, paddingVertical: 8 },
  sendBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.customerPrimary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: Colors.surfaceAlt },
});
