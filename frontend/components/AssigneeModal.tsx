import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { X, Search, User, Building2, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

interface AssigneeModalProps {
  visible: boolean;
  onClose: () => void;
  onAssign: (assigneeId: string, type: 'driver' | 'carrier') => void;
  jobId: string;
}

export default function AssigneeModal({ visible, onClose, onAssign, jobId }: AssigneeModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'driver' | 'carrier'>('driver');

  useEffect(() => {
    if (visible) {
      loadUsers();
    }
  }, [visible]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient('/admin/users');
      // res is Array of users based on AdminController.getUsersList
      setUsers(res || []);
    } catch (error) {
      console.error('Failed to load users for assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesTab = u.role === activeTab;
    const matchesSearch = 
      u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.carrierProfile?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Assign Job</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'driver' && styles.activeTab]} 
              onPress={() => setActiveTab('driver')}
            >
              <User size={18} color={activeTab === 'driver' ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'driver' && styles.activeTabText]}>Drivers</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'carrier' && styles.activeTab]} 
              onPress={() => setActiveTab('carrier')}
            >
              <Building2 size={18} color={activeTab === 'carrier' ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'carrier' && styles.activeTabText]}>Carriers</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Search size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${activeTab}s...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {loading ? (
            <ActivityIndicator style={styles.loader} color={Colors.primary} />
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.userCard}
                  onPress={() => onAssign(item.id, activeTab)}
                >
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {item.firstName} {item.lastName}
                    </Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    {item.carrierProfile?.companyName && (
                        <Text style={styles.companyName}>{item.carrierProfile.companyName}</Text>
                    )}
                  </View>
                  <View style={styles.assignChevron}>
                    <Check size={18} color={Colors.primary} />
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No {activeTab}s found matching your search.</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  activeTabText: {
    color: Colors.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  loader: {
    marginTop: 40,
  },
  listContent: {
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  companyName: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  assignChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  }
});
