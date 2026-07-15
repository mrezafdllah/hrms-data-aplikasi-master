import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

export default function PositionsScreen() {
  const [positions, setPositions] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [jobModalVisible, setJobModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ job_id: '', position_name: '', description: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [positionsRes, jobsRes] = await Promise.all([
        api.get('/positions'),
        api.get('/jobs')
      ]);
      if (positionsRes.data?.status === 'Success') setPositions(positionsRes.data.data);
      if (jobsRes.data?.status === 'Success') setJobs(jobsRes.data.data);
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
    if (!formData.job_id || !formData.position_name) {
      Alert.alert('Peringatan', 'Pekerjaan (Job) dan nama posisi wajib diisi.');
      return;
    }

    const payload = {
      ...formData,
      job_id: parseInt(formData.job_id)
    };

    try {
      if (editingId) {
        await api.put(`/positions/${editingId}`, payload);
        Alert.alert('Sukses', 'Posisi berhasil diperbarui.');
      } else {
        await api.post('/positions', payload);
        Alert.alert('Sukses', 'Posisi berhasil ditambahkan.');
      }
      setModalVisible(false);
      setEditingId(null);
      setFormData({ job_id: '', position_name: '', description: '' });
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan data.');
    }
  };

  const handleEdit = (pos: any) => {
    setFormData({
      job_id: pos.job_id.toString(),
      position_name: pos.position_name,
      description: pos.description || '',
    });
    setEditingId(pos.id);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert('Konfirmasi Hapus', 'Apakah Anda yakin ingin menghapus posisi ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/positions/${id}`);
            Alert.alert('Sukses', 'Posisi berhasil dihapus.');
            fetchData();
          } catch (error) {
            Alert.alert('Error', 'Gagal menghapus posisi.');
          }
        }
      }
    ]);
  };

  const openAddModal = () => {
    setFormData({ job_id: '', position_name: '', description: '' });
    setEditingId(null);
    setModalVisible(true);
  };

  const getJobName = (jobId: string) => {
    const job: any = jobs.find((j: any) => j.id.toString() === jobId);
    return job ? `${job.job_name} (${job.company_name})` : 'Pilih Pekerjaan (Job)...';
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <View style={styles.badgeContainer}>
          <Text style={styles.jobBadge}>{item.job_name} - {item.company_name || 'No Company'}</Text>
        </View>
        <Text style={styles.positionName}>{item.position_name}</Text>
        <Text style={styles.positionDesc}>{item.description || '-'}</Text>
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
        <Text style={styles.title}>Jabatan (Positions)</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#7b3fe4" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={positions}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="git-branch-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>Belum ada data posisi.</Text>
            </View>
          }
        />
      )}

      {/* Main Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Posisi' : 'Tambah Posisi'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1e2022" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Pekerjaan (Job Link)</Text>
              <TouchableOpacity style={styles.selector} onPress={() => setJobModalVisible(true)}>
                <Text style={styles.selectorText}>
                  {formData.job_id ? getJobName(formData.job_id) : 'Pilih Pekerjaan (Job)...'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nama Posisi / Jabatan</Text>
              <TextInput
                style={styles.input}
                value={formData.position_name}
                onChangeText={(text) => setFormData({ ...formData, position_name: text })}
                placeholder="Contoh: Senior React Developer"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Deskripsi Jabatan</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Spesifikasi jabatan detail..."
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

      {/* Job Selector Modal */}
      <Modal visible={jobModalVisible} transparent animationType="fade">
        <View style={styles.selectorOverlay}>
          <View style={styles.selectorContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Pekerjaan (Job)</Text>
              <TouchableOpacity onPress={() => setJobModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1e2022" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={jobs}
              keyExtractor={(item: any) => item.id.toString()}
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity 
                  style={styles.selectorItem} 
                  onPress={() => {
                    setFormData({ ...formData, job_id: item.id.toString() });
                    setJobModalVisible(false);
                  }}
                >
                  <Text style={styles.selectorItemText}>{item.job_name} ({item.company_name})</Text>
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
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  jobBadge: {
    fontSize: 10,
    color: '#7b3fe4',
    fontWeight: 'bold',
  },
  positionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e2022',
    marginBottom: 6,
  },
  positionDesc: {
    fontSize: 13,
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
  selector: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
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
