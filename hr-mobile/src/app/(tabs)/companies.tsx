import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

export default function CompaniesScreen() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ company_name: '', address: '', phone: '', email: '' });

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await api.get('/companies');
      if (response.data?.status === 'Success') {
        setCompanies(response.data.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data perusahaan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSubmit = async () => {
    if (!formData.company_name) {
      Alert.alert('Peringatan', 'Nama perusahaan wajib diisi.');
      return;
    }

    Alert.alert(
      editingId ? 'Konfirmasi Edit' : 'Konfirmasi Tambah',
      editingId 
        ? `Apakah Anda yakin ingin menyimpan perubahan data perusahaan "${formData.company_name}"?`
        : `Apakah Anda yakin ingin menambahkan perusahaan baru "${formData.company_name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Simpan', onPress: () => executeSubmit() }
      ]
    );
  };

  const executeSubmit = async () => {
    try {
      if (editingId) {
        await api.put(`/companies/${editingId}`, formData);
        Alert.alert('Sukses', 'Perusahaan berhasil diperbarui.');
      } else {
        await api.post('/companies', formData);
        Alert.alert('Sukses', 'Perusahaan berhasil ditambahkan.');
      }
      setModalVisible(false);
      setEditingId(null);
      setFormData({ company_name: '', address: '', phone: '', email: '' });
      fetchCompanies();
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan data.');
    }
  };

  const handleEdit = (company: any) => {
    setFormData({
      company_name: company.company_name,
      address: company.address || '',
      phone: company.phone || '',
      email: company.email || '',
    });
    setEditingId(company.id);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert('Konfirmasi Hapus', 'Apakah Anda yakin ingin menghapus perusahaan ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/companies/${id}`);
            Alert.alert('Sukses', 'Perusahaan berhasil dihapus.');
            fetchCompanies();
          } catch (error) {
            Alert.alert('Error', 'Gagal menghapus perusahaan.');
          }
        }
      }
    ]);
  };

  const openAddModal = () => {
    setFormData({ company_name: '', address: '', phone: '', email: '' });
    setEditingId(null);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <View style={styles.badgeContainer}>
          <Text style={styles.cardId}>ID: {item.id}</Text>
        </View>
        <Text style={styles.companyName}>{item.company_name}</Text>
        {item.email ? (
          <View style={styles.metaRow}>
            <Ionicons name="mail-outline" size={13} color="#9ca3af" />
            <Text style={styles.metaText}>{item.email}</Text>
          </View>
        ) : null}
        {item.phone ? (
          <View style={styles.metaRow}>
            <Ionicons name="call-outline" size={13} color="#9ca3af" />
            <Text style={styles.metaText}>{item.phone}</Text>
          </View>
        ) : null}
        {item.address ? (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color="#9ca3af" />
            <Text style={styles.metaText} numberOfLines={1}>{item.address}</Text>
          </View>
        ) : null}
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
        <Text style={styles.title}>Perusahaan</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#7b3fe4" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={companies}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>Belum ada data perusahaan.</Text>
            </View>
          }
        />
      )}

      {/* Modal Add/Edit */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Perusahaan' : 'Tambah Perusahaan'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1e2022" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nama Perusahaan</Text>
                <TextInput
                  style={styles.input}
                  value={formData.company_name}
                  onChangeText={(text) => setFormData({ ...formData, company_name: text })}
                  placeholder="Contoh: PT Blitz Nusantara"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="info@perusahaan.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nomor Telepon</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="021-xxxxxxxx"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Alamat Lengkap</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholder="Tulis alamat kantor pusat..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

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
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  cardId: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e2022',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
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
    marginTop: 20,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
