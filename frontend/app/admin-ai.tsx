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
  Shield,
  Activity,
  BarChart3,
  Users,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  { label: 'Platform performance', icon: Activity, query: 'Show platform operational performance' },
  { label: 'Financial anomalies', icon: AlertTriangle, query: 'Are there any financial anomalies?' },
  { label: 'Revenue snapshot', icon: BarChart3, query: 'What is the total revenue today?' },
  { label: 'Carrier compliance', icon: Shield, query: 'Show carrier compliance status' },
  { label: 'Active user count', icon: Users, query: 'How many active users are online?' },
];

export default function AdminAIScreen() {
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

  const sendMessage = useCallback(async (text: string) => {
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

    try {
      const res = await apiClient('/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text.trim() })
      });

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: res.response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
          id: `msg-${Date.now()}-error`,
          role: 'assistant',
          content: 'Sorry, I encountered an error communicating with the AI. Please try again later.',
          timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, []);

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
      <Stack.Screen options={{ title: 'Admin AI Control' }} />

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
              <Brain size={36} color={Colors.adminPrimary} />
            </View>
            <Text style={styles.welcomeTitle}>Admin AI Assistant</Text>
            <Text style={styles.welcomeSub}>
              Ask me about platform health, financial anomalies, carrier compliance, or revenue insights. I have access to the entire CYVHUB data lake.
            </Text>

            <Text style={styles.promptsTitle}>Global Insights</Text>
            <View style={styles.promptsGrid}>
              {QUICK_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt.label}
                  style={styles.promptCard}
                  onPress={() => handleQuickPrompt(prompt.query)}
                  activeOpacity={0.7}
                >
                  <prompt.icon size={16} color={Colors.adminPrimary} />
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
                <Brain size={12} color={Colors.adminPrimary} />
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
              <Brain size={12} color={Colors.adminPrimary} />
            </View>
            <Text style={styles.typingText}>Scanning platform data...</Text>
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
          placeholder="Command center query..."
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
    backgroundColor: Colors.adminPrimary + '12',
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
    backgroundColor: Colors.adminPrimary,
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
    backgroundColor: Colors.adminPrimary + '12',
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
    backgroundColor: Colors.adminPrimary + '10',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.adminPrimary + '20',
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.adminPrimary,
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
    backgroundColor: Colors.adminPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.surfaceAlt,
  },
});
