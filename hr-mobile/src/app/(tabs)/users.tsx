import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [positionModalVisible, setPositionModalVisible] = useState(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    role_id: '',
    position_id: '',
    full_name: '',
    email: '',
    hashed_password: '',
    status: 'Active'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, positionsRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles'),
        api.get('/positions')
      ]);
      if (usersRes.data?.status === 'Success') setUsers(usersRes.data.data);
      if (rolesRes.data?.status === 'Success') setRoles(rolesRes.data.data);
      if (positionsRes.data?.status === 'Success') setPositions(positionsRes.data.data);
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.email || (!editingId && !formData.hashed_password)) {
      Alert.alert('Peringatan', 'Nama, Email, dan Password wajib diisi.');
      return;
    }

    const payload = {
      ...formData,
      role_id: formData.role_id ? parseInt(formData.role_id) : null,
      position_id: formData.position_id ? parseInt(formData.position_id) : null,
    };

    if (editingId) {
      delete (payload as any).hashed_password;
    }

    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, payload);
        Alert.alert('Sukses', 'User berhasil diperbarui.');
      } else {
        await api.post('/users', payload);
        Alert.alert('Sukses', 'User berhasil ditambahkan.');
      }
      setModalVisible(false);
      setEditingId(null);
      setFormData({ role_id: '', position_id: '', full_name: '', email: '', hashed_password: '', status: 'Active' });
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Gagal menyimpan data.');
    }
  };

  const handleEdit = (user: any) => {
    setFormData({
      role_id: user.role_id ? user.role_id.toString() : '',
      position_id: user.position_id ? user.position_id.toString() : '',
      full_name: user.full_name,
      email: user.email,
      hashed_password: '',
      status: user.status
    });
    setEditingId(user.id);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert('Konfirmasi Hapus', 'Apakah Anda yakin ingin menghapus user ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/users/${id}`);
            Alert.alert('Sukses', 'User berhasil dihapus.');
            fetchData();
          } catch (error) {
            Alert.alert('Error', 'Gagal menghapus user.');
          }
        }
      }
    ]);
  };

  const openAddModal = () => {
    setFormData({ role_id: '', position_id: '', full_name: '', email: '', hashed_password: '', status: 'Active' });
    setEditingId(null);
    setModalVisible(true);
  };

  const getRoleName = (roleId: string) => {
    const r: any = roles.find((item: any) => item.id.toString() === roleId);
    return r ? r.role_name : 'Pilih Role...';
  };

  const getPositionName = (posId: string) => {
    const p: any = positions.find((item: any) => item.id.toString() === posId);
    return p ? `${p.position_name} (${p.company_name})` : 'Pilih Posisi...';
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <View style={styles.headerRow}>
          <Text style={styles.userName}>{item.full_name}</Text>
          <Text style={[
            styles.statusBadge, 
            item.status === 'Active' ? styles.statusActive : styles.statusInactive
          ]}>
            {item.status}
          </Text>
        </View>
        <Text style={styles.userEmail}>{item.email}</Text>
        
        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <Ionicons name="shield-checkmark-outline" size={13} color="#9ca3af" />
            <Text style={styles.metaText}>{item.role_name || 'Tanpa Role'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="git-branch-outline" size={13} color="#9ca3af" />
            <Text style={styles.metaText}>{item.position_name || 'Tanpa Posisi'}</Text>
          </View>
          {item.company_name ? (
            <View style={styles.metaRow}>
              <Ionicons name="business-outline" size={13} color="#9ca3af" />
              <Text style={styles.metaText}>{item.company_name}</Text>
            </View>
          ) : null}
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => handleEdit(item)}>
          <Ionicons name="create-outline" size={16} color="#7b3fe4" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manajemen User</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#7b3fe4" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>Belum ada data user.</Text>
            </View>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit User' : 'Tambah User'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1e2022" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nama Lengkap</Text>
                <TextInput
                  style={styles.input}
                  value={formData.full_name}
                  onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                  placeholder="Nama Lengkap"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="name@company.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {!editingId && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.hashed_password}
                    onChangeText={(text) => setFormData({ ...formData, hashed_password: text })}
                    placeholder="Minimal 6 karakter"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                  />
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Role</Text>
                <TouchableOpacity style={styles.selector} onPress={() => setRoleModalVisible(true)}>
                  <Text style={styles.selectorText}>
                    {formData.role_id ? getRoleName(formData.role_id) : 'Pilih Role...'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Posisi / Jabatan</Text>
                <TouchableOpacity style={styles.selector} onPress={() => setPositionModalVisible(true)}>
                  <Text style={styles.selectorText}>
                    {formData.position_id ? getPositionName(formData.position_id) : 'Pilih Posisi / Jabatan...'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.statusOptions}>
                  <TouchableOpacity 
                    style={[styles.statusOption, formData.status === 'Active' && styles.statusOptionActive]}
                    onPress={() => setFormData({ ...formData, status: 'Active' })}
                  >
                    <Text style={[styles.statusOptionText, formData.status === 'Active' && styles.statusOptionTextActive]}>Active</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.statusOption, formData.status === 'Inactive' && styles.statusOptionActiveRed]}
                    onPress={() => setFormData({ ...formData, status: 'Inactive' })}
                  >
                    <Text style={[styles.statusOptionText, formData.status === 'Inactive' && styles.statusOptionTextActiveRed]}>Inactive</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Role Selector Modal */}
      <Modal visible={roleModalVisible} transparent animationType="fade">
        <View style={styles.selectorOverlay}>
          <View style={styles.selectorContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Role</Text>
              <TouchableOpacity onPress={() => setRoleModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1e2022" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={roles}
              keyExtractor={(item: any) => item.id.toString()}
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity 
                  style={styles.selectorItem} 
                  onPress={() => {
                    setFormData({ ...formData, role_id: item.id.toString() });
                    setRoleModalVisible(false);
                  }}
                >
                  <Text style={styles.selectorItemText}>{item.role_name}</Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 300 }}
            />
          </View>
        </View>
      </Modal>

      {/* Position Selector Modal */}
      <Modal visible={positionModalVisible} transparent animationType="fade">
        <View style={styles.selectorOverlay}>
          <View style={styles.selectorContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Posisi / Jabatan</Text>
              <TouchableOpacity onPress={() => setPositionModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1e2022" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={positions}
              keyExtractor={(item: any) => item.id.toString()}
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity 
                  style={styles.selectorItem} 
                  onPress={() => {
                    setFormData({ ...formData, position_id: item.id.toString() });
                    setPositionModalVisible(false);
                  }}
                >
                  <Text style={styles.selectorItemText}>{item.position_name} ({item.company_name})</Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 300 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fbfd',
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e2022',
  },
  addBtn: {
    backgroundColor: '#7b3fe4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  listContainer: {
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 10,
    elevation: 1,
  },
  cardInfo: {
    flex: 1,
    marginRight: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e2022',
  },
  userEmail: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  statusActive: {
    backgroundColor: '#f5f3ff',
    color: '#7b3fe4',
  },
  statusInactive: {
    backgroundColor: '#fef2f2',
    color: '#ef4444',
  },
  metaContainer: {
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    backgroundColor: '#f5f3ff',
  },
  deleteBtn: {
    backgroundColor: '#fef2f2',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 12,
  },
  emptyText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 14,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e2022',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  selector: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 15,
    color: '#1f2937',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f2937',
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: '#f5f3ff',
    borderColor: '#7b3fe4',
  },
  statusOptionActiveRed: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  statusOptionTextActive: {
    color: '#7b3fe4',
  },
  statusOptionTextActiveRed: {
    color: '#ef4444',
  },
  submitBtn: {
    backgroundColor: '#7b3fe4',
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: 'center',
    shadowColor: '#7b3fe4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginTop: 10,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // Selector list overlay
  selectorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  selectorContent: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
  },
  selectorItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectorItemText: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '600',
  },
});
