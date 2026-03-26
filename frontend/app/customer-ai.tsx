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
  ActivityIndicator,
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
import { apiClient } from '@/services/api';

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

export default function CustomerAIScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  
  const scrollRef = useRef<ScrollView>(null);
  const typingAnim = useRef(new Animated.Value(0)).current;

  const loadInitialData = async () => {
    try {
      const res = await apiClient('/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'summarise my performance this month' })
      });
      setSummary({
        monthlySummary: res.response,
        suggestions: [
          'Consolidate peak-time deliveries to save costs',
          'Review SLA for long-haul routes to ensure compliance',
          'Optimize vehicle selection for small parcels to reduce emissions'
        ]
      });
    } catch (e) {
      console.error('Failed to load AI summary:', e);
      // Fallback if AI fails or no data yet
      setSummary({
        monthlySummary: 'Welcome to your AI Assistant. I can help you analyze your delivery performance, costs, and sustainability metrics.',
        suggestions: [
          'Show my SLA performance',
          'Which routes cost the most?',
          'What invoices are unpaid?'
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const sendMessage = useCallback(async (text: string) => {
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

    try {
      const res = await apiClient('/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text.trim() })
      });

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        text: res.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        text: 'Sorry, I encountered an error communicating with the AI. Please try again later.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
      typingAnim.stopAnimation();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [typingAnim]);

  const handleSuggestion = useCallback((text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendMessage(text);
  }, [sendMessage]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.customerPrimary} />
      </View>
    );
  }

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
          {messages.length === 0 && summary && (
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
                  <Text style={styles.summaryTitle}>AI Analysis</Text>
                </View>
                <Text style={styles.summaryText}>{summary.monthlySummary}</Text>
              </View>

              <View style={styles.suggestionsSection}>
                <View style={styles.suggestionsHeader}>
                  <Lightbulb size={14} color={Colors.warning} />
                  <Text style={styles.suggestionsTitle}>AI Suggestions</Text>
                </View>
                {summary.suggestions.map((s: string, i: number) => (
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
