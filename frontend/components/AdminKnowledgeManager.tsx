import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Plus, Save, Trash2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';

type Mode = 'faq' | 'templates' | 'policies';

const labels = {
  faq: { title: 'FAQ Manager', endpoint: '/knowledge/faq', listKey: 'faqs' },
  templates: { title: 'Response Templates', endpoint: '/knowledge/templates', listKey: 'templates' },
  policies: { title: 'Policy Manager', endpoint: '/knowledge/policies', listKey: 'policies' },
};

export default function AdminKnowledgeManager({ mode }: { mode: Mode }) {
  const { admin } = useAuth();
  const isSuper = (admin as any)?.role === 'super_admin';
  const config = labels[mode];
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const categoryType = mode === 'faq' ? 'faq' : mode === 'templates' ? 'template' : 'policy';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, cats] = await Promise.all([
        apiClient(`${config.endpoint}${mode === 'faq' ? '?includeDrafts=true' : ''}`),
        apiClient(`/knowledge/categories?type=${categoryType}`)
      ]);
      setItems(list[config.listKey] || []);
      setCategories(cats.categories || []);
    } finally {
      setLoading(false);
    }
  }, [categoryType, config.endpoint, config.listKey, mode]);

  useEffect(() => { load(); }, [load]);

  const empty = useMemo(() => {
    if (mode === 'faq') return { question: '', answer: '', order: 0, publishStatus: 'DRAFT' };
    if (mode === 'templates') return { title: '', scenario: '', responseMessage: '', internalNotes: '', isActive: true };
    return { title: '', description: '', fullContent: '', version: '1.0' };
  }, [mode]);

  const save = async () => {
    if (!isSuper) return Alert.alert('Restricted', 'Only Super Admin can edit this content.');
    await apiClient(config.endpoint, { method: 'POST', body: JSON.stringify(selected) });
    setSelected(null);
    await load();
  };

  const remove = async (id: string) => {
    if (!isSuper) return Alert.alert('Restricted', 'Only Super Admin can delete this content.');
    await apiClient(`${config.endpoint}/${id}`, { method: 'DELETE' });
    setSelected(null);
    await load();
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.adminPrimary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>{isSuper ? 'Create, edit, delete, categorize, and publish content.' : 'Read-only access for Admin users.'}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setSelected(empty)} activeOpacity={0.8}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          <View style={styles.list}>
            {items.map((item) => (
              <TouchableOpacity key={item.id} style={styles.row} onPress={() => setSelected(item)} activeOpacity={0.75}>
                <Text style={styles.rowTitle}>{item.title || item.question}</Text>
                <Text style={styles.rowSub}>{item.category?.name || 'Uncategorized'} {item.publishStatus ? `- ${item.publishStatus}` : ''}</Text>
              </TouchableOpacity>
            ))}
            {!items.length && <Text style={styles.empty}>No records yet.</Text>}
          </View>
          <View style={styles.editor}>
            {selected ? (
              <>
                {mode === 'faq' ? (
                  <>
                    <Field label="Question" value={selected.question} onChangeText={(v) => setSelected({ ...selected, question: v })} />
                    <Field label="Answer" value={selected.answer} onChangeText={(v) => setSelected({ ...selected, answer: v })} multiline />
                    <Field label="Order" value={String(selected.order ?? 0)} onChangeText={(v) => setSelected({ ...selected, order: Number(v) || 0 })} />
                    <Field label="Publish Status" value={selected.publishStatus || 'DRAFT'} onChangeText={(v) => setSelected({ ...selected, publishStatus: v.toUpperCase() })} />
                  </>
                ) : mode === 'templates' ? (
                  <>
                    <Field label="Title" value={selected.title} onChangeText={(v) => setSelected({ ...selected, title: v })} />
                    <Field label="Scenario" value={selected.scenario} onChangeText={(v) => setSelected({ ...selected, scenario: v })} multiline />
                    <Field label="Response Message" value={selected.responseMessage} onChangeText={(v) => setSelected({ ...selected, responseMessage: v })} multiline />
                    <Field label="Internal Notes" value={selected.internalNotes || ''} onChangeText={(v) => setSelected({ ...selected, internalNotes: v })} multiline />
                  </>
                ) : (
                  <>
                    <Field label="Title" value={selected.title} onChangeText={(v) => setSelected({ ...selected, title: v })} />
                    <Field label="Description" value={selected.description} onChangeText={(v) => setSelected({ ...selected, description: v })} multiline />
                    <Field label="Full Content" value={selected.fullContent} onChangeText={(v) => setSelected({ ...selected, fullContent: v })} multiline />
                    <Field label="Version" value={selected.version || '1.0'} onChangeText={(v) => setSelected({ ...selected, version: v })} />
                  </>
                )}
                <Text style={styles.label}>Category ID</Text>
                <TextInput style={styles.input} value={selected.categoryId || selected.category?.id || ''} onChangeText={(v) => setSelected({ ...selected, categoryId: v })} placeholder={categories.map(c => c.name).join(', ') || 'Create categories through API'} />
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.save} onPress={save}><Save size={16} color="#FFFFFF" /><Text style={styles.saveText}>Save</Text></TouchableOpacity>
                  {selected.id && <TouchableOpacity style={styles.delete} onPress={() => remove(selected.id)}><Trash2 size={16} color={Colors.danger} /><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>}
                </View>
              </>
            ) : (
              <Text style={styles.empty}>Select a record to edit.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Field(props: { label: string; value?: string; onChangeText: (v: string) => void; multiline?: boolean }) {
  return (
    <View>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput style={[styles.input, props.multiline && styles.textarea]} value={props.value || ''} onChangeText={props.onChangeText} multiline={props.multiline} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: Colors.navy, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  subtitle: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.adminPrimary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  addText: { color: '#FFFFFF', fontWeight: '700' },
  content: { padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  list: { flex: 1, minWidth: 300 },
  editor: { flex: 1, minWidth: 320, backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  row: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 14, marginBottom: 8 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  rowSub: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  label: { fontSize: 12, fontWeight: '800', color: Colors.textMuted, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, color: Colors.text, backgroundColor: '#FFFFFF' },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  save: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.adminPrimary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12 },
  saveText: { color: '#FFFFFF', fontWeight: '800' },
  delete: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.dangerLight, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12 },
  deleteText: { color: Colors.danger, fontWeight: '800' },
  empty: { color: Colors.textMuted, padding: 18, textAlign: 'center' },
});
