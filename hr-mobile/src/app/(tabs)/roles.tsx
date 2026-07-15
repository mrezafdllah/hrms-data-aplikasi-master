import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

export default function RolesScreen() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ role_name: '', description: '' });

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/roles');
      if (response.data?.status === 'Success') {
        setRoles(response.data.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data role.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSubmit = async () => {
    if (!formData.role_name) {
      Alert.alert('Peringatan', 'Nama role wajib diisi.');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/roles/${editingId}`, formData);
        Alert.alert('Sukses', 'Role berhasil diperbarui.');
      } else {
        await api.post('/roles', formData);
        Alert.alert('Sukses', 'Role berhasil ditambahkan.');
      }
      setModalVisible(false);
      setEditingId(null);
      setFormData({ role_name: '', description: '' });
      fetchRoles();
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan data.');
    }
  };

  const handleEdit = (role: any) => {
    setFormData({ role_name: role.role_name, description: role.description || '' });
    setEditingId(role.id);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert('Konfirmasi Hapus', 'Apakah Anda yakin ingin menghapus role ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/roles/${id}`);
            Alert.alert('Sukses', 'Role berhasil dihapus.');
            fetchRoles();
          } catch (error) {
            Alert.alert('Error', 'Gagal menghapus role.');
          }
        }
      }
    ]);
  };

  const openAddModal = () => {
    setFormData({ role_name: '', description: '' });
    setEditingId(null);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.roleCard}>
      <View style={styles.cardInfo}>
        <View style={styles.badgeContainer}>
          <Text style={styles.roleId}>ID: {item.id}</Text>
        </View>
        <Text style={styles.roleName}>{item.role_name}</Text>
        <Text style={styles.roleDesc}>{item.description || '-'}</Text>
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
        <Text style={styles.title}>Manajemen Role</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#7b3fe4" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={roles}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>Belum ada data role.</Text>
            </View>
          }
        />
      )}

      {/* Modal Add/Edit */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Role' : 'Tambah Role'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1e2022" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nama Role</Text>
              <TextInput
                style={styles.input}
                value={formData.role_name}
                onChangeText={(text) => setFormData({ ...formData, role_name: text })}
                placeholder="Contoh: Super Admin, Karyawan"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Deskripsi</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Deskripsi tugas dan wewenang role..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Simpan</Text>
            </TouchableOpacity>
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
  roleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginRight: 10,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  roleId: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  roleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e2022',
  },
  roleDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
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
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
});
