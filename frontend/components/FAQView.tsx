import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChevronDown, HelpCircle, Search } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

export default function FAQView({ embedded = false }: { embedded?: boolean }) {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    apiClient('/knowledge/faq')
      .then((res) => setFaqs(res.faqs || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter((f) => `${f.question} ${f.answer} ${f.category?.name || ''}`.toLowerCase().includes(q));
  }, [faqs, query]);

  const groups = useMemo(() => {
    return filtered.reduce((acc: Record<string, any[]>, item) => {
      const key = item.category?.name || 'General';
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [filtered]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;
  }

  return (
    <ScrollView style={[styles.container, embedded && styles.embedded]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.icon}><HelpCircle size={24} color={Colors.primary} /></View>
        <Text style={styles.title}>FAQ</Text>
        <Text style={styles.subtitle}>Find answers across bookings, payments, tracking, drivers, and carrier support.</Text>
      </View>
      <View style={styles.search}>
        <Search size={18} color={Colors.textMuted} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search FAQs" placeholderTextColor={Colors.textMuted} style={styles.input} />
      </View>
      {Object.entries(groups).map(([category, items]) => (
        <View key={category} style={styles.group}>
          <Text style={styles.category}>{category}</Text>
          {items.map((item) => {
            const isOpen = openId === item.id;
            return (
              <TouchableOpacity key={item.id} style={styles.item} activeOpacity={0.8} onPress={() => setOpenId(isOpen ? null : item.id)}>
                <View style={styles.questionRow}>
                  <Text style={styles.question}>{item.question}</Text>
                  <ChevronDown size={18} color={Colors.textMuted} style={isOpen ? styles.chevronOpen : undefined} />
                </View>
                {isOpen && <Text style={styles.answer}>{item.answer}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
      {!filtered.length && <Text style={styles.empty}>No matching FAQs.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  embedded: { backgroundColor: Colors.background },
  content: { padding: 20, maxWidth: 980, width: '100%', alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingVertical: 20 },
  icon: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.primary + '14', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 30, fontWeight: '800', color: Colors.navy },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 6, lineHeight: 22 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, marginBottom: 20 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: Colors.text },
  group: { marginBottom: 18 },
  category: { fontSize: 13, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 8 },
  item: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 16, marginBottom: 8 },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  question: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.text },
  answer: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21, marginTop: 12 },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  empty: { color: Colors.textMuted, textAlign: 'center', padding: 24 },
});
