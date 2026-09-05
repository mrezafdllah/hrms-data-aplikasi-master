import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import CustomAlert from '../../components/CustomAlert';

export default function PositionsScreen() {
  const [positions, setPositions] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [jobModalVisible, setJobModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ job_id: '', position_name: '', description: '' });

  const [searchQuery, setSearchQuery] = useState('');
  const [jobSearch, setJobSearch] = useState('');

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({ type: 'info', title: '', message: '' });

  const showAlert = (type: string, title: string, message: string, onConfirm?: () => void) => {
    setAlertConfig({ type, title, message, onConfirm });
    setAlertVisible(true);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const storedRole = await AsyncStorage.getItem('role');
      if (storedRole) setUserRole(storedRole);

      const [positionsRes, jobsRes] = await Promise.all([
        api.get('/positions'),
        api.get('/jobs')
      ]);
      if (positionsRes.data?.status === 'Success') setPositions(positionsRes.data.data);
      if (jobsRes.data?.status === 'Success') setJobs(jobsRes.data.data);
    } catch (error) {
      showAlert('error', 'Error', 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!formData.job_id || !formData.position_name) {
      showAlert('warning', 'Peringatan', 'Divisi dan nama posisi wajib diisi.');
      return;
    }

    showAlert(
      'confirm',
      editingId ? 'Konfirmasi Edit' : 'Konfirmasi Tambah',
      editingId 
        ? `Apakah Anda yakin ingin menyimpan perubahan data jabatan "${formData.position_name}"?`
        : `Apakah Anda yakin ingin menambahkan jabatan baru "${formData.position_name}"?`,
      () => executeSubmit()
    );
  };

  const isAdmin = userRole === 'Super Admin' || userRole === 'Admin HR';

  const filteredPositions = positions.filter((p: any) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const pos = (p.position_name || '').toLowerCase();
    const job = (p.job_name || '').toLowerCase();
    const comp = (p.company_name || '').toLowerCase();
    return pos.includes(q) || job.includes(q) || comp.includes(q);
  });

  const filteredModalJobs = jobs.filter((j: any) => {
    const q = jobSearch.toLowerCase().trim();
    if (!q) return true;
    const jName = (j.job_name || '').toLowerCase();
    const compName = (j.company_name || '').toLowerCase();
    return jName.includes(q) || compName.includes(q);
  });

  const executeSubmit = async () => {
    const payload = {
      ...formData,
      job_id: parseInt(formData.job_id)
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/positions/${editingId}`, payload);
        showAlert('success', 'Sukses', 'Posisi berhasil diperbarui.');
      } else {
        await api.post('/positions', payload);
        showAlert('success', 'Sukses', 'Posisi berhasil ditambahkan.');
      }
      setModalVisible(false);
      setEditingId(null);
      setFormData({ job_id: '', position_name: '', description: '' });
      fetchData();
    } catch (error) {
      showAlert('error', 'Error', 'Gagal menyimpan data.');
    } finally {
      setSubmitting(false);
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
    showAlert(
      'delete',
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus posisi ini? Data yang dihapus tidak dapat dikembalikan.',
      async () => {
        try {
          await api.delete(`/positions/${id}`);
          showAlert('success', 'Sukses', 'Posisi berhasil dihapus.');
          fetchData();
        } catch (error) {
          showAlert('error', 'Error', 'Gagal menghapus posisi.');
        }
      }
    );
  };

  const openAddModal = () => {
    setFormData({ job_id: '', position_name: '', description: '' });
    setEditingId(null);
    setModalVisible(true);
  };

  const getJobName = (jobId: string) => {
    const job: any = jobs.find((j: any) => j.id.toString() === jobId);
    return job ? `${job.job_name} (${job.company_name})` : 'Pilih Divisi...';
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
        {isAdmin ? (
          <>
            <TouchableOpacity activeOpacity={0.7} style={[styles.actionBtn, styles.editBtn]} onPress={() => handleEdit(item)}>
              <Ionicons name="create-outline" size={16} color="#f97316" />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ backgroundColor: '#f8fafc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#f1f5f9' }}>
            <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '600' }}>Jabatan</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Jabatan (Positions)</Text>
          <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '600', marginTop: 2 }}>
            {isAdmin ? 'Kelola penugasan dan tingkatan jabatan' : 'Daftar jabatan aktif di perusahaan'}
          </Text>
        </View>
        {isAdmin && (
          <TouchableOpacity activeOpacity={0.7} style={styles.addBtn} onPress={openAddModal}>
            <Text style={styles.addBtnText}>+ Tambah</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Screen Search Bar */}
      <View style={styles.mainSearchBar}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" />
        <TextInput
          style={styles.mainSearchInput}
          placeholder="Cari jabatan, divisi, perusahaan..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredPositions}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="git-branch-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>
                {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : 'Belum ada data posisi.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Add/Edit Modal */}
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
              <Text style={styles.label}>Divisi</Text>
              <TouchableOpacity 
                activeOpacity={0.7} 
                style={styles.selector} 
                onPress={() => {
                  setJobSearch('');
                  setJobModalVisible(true);
                }}
              >
                <Text style={styles.selectorText}>
                  {formData.job_id ? getJobName(formData.job_id) : 'Pilih Divisi...'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nama Jabatan</Text>
              <TextInput
                style={[styles.input, focusedField === 'position_name' && styles.inputFocused]}
                value={formData.position_name}
                onChangeText={(text) => setFormData({ ...formData, position_name: text })}
                onFocus={() => setFocusedField('position_name')}
                onBlur={() => setFocusedField(null)}
                placeholder="Contoh: Senior React Developer"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Deskripsi Jabatan</Text>
              <TextInput
                style={[styles.input, styles.textArea, focusedField === 'description' && styles.inputFocused]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
                placeholder="Spesifikasi jabatan detail..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity 
              activeOpacity={0.7} 
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Simpan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Job Selector Modal */}
      <Modal visible={jobModalVisible} transparent animationType="fade">
        <View style={styles.selectorOverlay}>
          <View style={styles.selectorContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Pilih Divisi</Text>
                <Text style={styles.modalSubtitle}>Ketik nama divisi untuk mencari</Text>
              </View>
              <TouchableOpacity onPress={() => setJobModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Live Search Input */}
            <View style={styles.modalSearchBar}>
              <Ionicons name="search-outline" size={18} color="#9ca3af" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Cari divisi atau perusahaan..."
                placeholderTextColor="#9ca3af"
                value={jobSearch}
                onChangeText={setJobSearch}
                autoCorrect={false}
              />
              {jobSearch.length > 0 && (
                <TouchableOpacity onPress={() => setJobSearch('')} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredModalJobs}
              keyExtractor={(item: any) => item.id.toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }: { item: any }) => {
                const isSelected = formData.job_id === item.id.toString();
                return (
                  <TouchableOpacity 
                    activeOpacity={0.7}
                    style={[styles.selectorItem, isSelected && styles.selectorItemSelected]} 
                    onPress={() => {
                      setFormData({ ...formData, job_id: item.id.toString() });
                      setJobModalVisible(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.selectorItemText, isSelected && styles.selectorItemTextSelected]}>
                        {item.job_name}
                      </Text>
                      <Text style={styles.selectorItemSubtext}>{item.company_name || 'Perusahaan'}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#f97316" />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptySearchContainer}>
                  <Ionicons name="search-outline" size={28} color="#d1d5db" />
                  <Text style={styles.emptySearchText}>
                    {jobSearch ? `Divisi "${jobSearch}" tidak ditemukan` : 'Belum ada data divisi.'}
                  </Text>
                </View>
              }
              style={{ maxHeight: 320 }}
            />
          </View>
        </View>
      </Modal>
      <CustomAlert
        visible={alertVisible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertConfig.onConfirm}
      />
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
    backgroundColor: '#f97316',
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
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
  jobBadge: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  positionName: {
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
    backgroundColor: '#fff7ed',
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
  inputFocused: {
    borderColor: '#f97316',
    borderWidth: 1.5,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: 'center',
    shadowColor: '#f97316',
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
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
  },
  selectorItemSelected: {
    backgroundColor: '#fff7ed',
  },
  selectorItemText: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '600',
  },
  selectorItemTextSelected: {
    color: '#f97316',
    fontWeight: 'bold',
  },
  selectorItemSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  mainSearchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1f2937',
    paddingVertical: 0,
  },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1f2937',
    paddingVertical: 0,
  },
  emptySearchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 35,
    gap: 8,
  },
  emptySearchText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
