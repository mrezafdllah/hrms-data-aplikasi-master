import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import CustomAlert from '../../components/CustomAlert';

export default function JobsScreen() {
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ company_id: '', job_name: '', description: '' });

  const [searchQuery, setSearchQuery] = useState('');
  const [companySearch, setCompanySearch] = useState('');

  // CustomAlert state
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

      const [jobsRes, compsRes] = await Promise.all([
        api.get('/jobs'),
        api.get('/companies')
      ]);
      if (jobsRes.data?.status === 'Success') setJobs(jobsRes.data.data);
      if (compsRes.data?.status === 'Success') setCompanies(compsRes.data.data);
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
    if (!formData.company_id || !formData.job_name) {
      showAlert('warning', 'Peringatan', 'Perusahaan dan nama divisi wajib diisi.');
      return;
    }

    showAlert(
      'confirm',
      editingId ? 'Konfirmasi Edit' : 'Konfirmasi Tambah',
      editingId 
        ? `Apakah Anda yakin ingin menyimpan perubahan data divisi "${formData.job_name}"?`
        : `Apakah Anda yakin ingin menambahkan divisi baru "${formData.job_name}"?`,
      () => executeSubmit()
    );
  };

  const isAdmin = userRole === 'Super Admin' || userRole === 'Admin HR';

  const filteredJobs = jobs.filter((j: any) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const jName = (j.job_name || '').toLowerCase();
    const compName = (j.company_name || '').toLowerCase();
    const desc = (j.description || '').toLowerCase();
    return jName.includes(q) || compName.includes(q) || desc.includes(q);
  });

  const filteredModalCompanies = companies.filter((c: any) => {
    const q = companySearch.toLowerCase().trim();
    if (!q) return true;
    return (c.company_name || '').toLowerCase().includes(q);
  });

  const executeSubmit = async () => {
    const payload = {
      ...formData,
      company_id: parseInt(formData.company_id)
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/jobs/${editingId}`, payload);
        showAlert('success', 'Sukses', 'Divisi berhasil diperbarui.');
      } else {
        await api.post('/jobs', payload);
        showAlert('success', 'Sukses', 'Divisi berhasil ditambahkan.');
      }
      setModalVisible(false);
      setEditingId(null);
      setFormData({ company_id: '', job_name: '', description: '' });
      fetchData();
    } catch (error) {
      showAlert('error', 'Error', 'Gagal menyimpan data.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (job: any) => {
    setFormData({
      company_id: job.company_id.toString(),
      job_name: job.job_name,
      description: job.description || '',
    });
    setEditingId(job.id);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    showAlert(
      'delete',
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus divisi ini? Data yang dihapus tidak dapat dikembalikan.',
      async () => {
        try {
          await api.delete(`/jobs/${id}`);
          showAlert('success', 'Sukses', 'Divisi berhasil dihapus.');
          fetchData();
        } catch (error) {
          showAlert('error', 'Error', 'Gagal menghapus divisi.');
        }
      }
    );
  };

  const openAddModal = () => {
    setFormData({ company_id: '', job_name: '', description: '' });
    setEditingId(null);
    setModalVisible(true);
  };

  const getCompanyName = (companyId: string) => {
    const comp: any = companies.find((c: any) => c.id.toString() === companyId);
    return comp ? comp.company_name : 'Pilih Perusahaan...';
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <View style={styles.badgeContainer}>
          <Text style={styles.companyBadge}>{item.company_name || 'No Company'}</Text>
        </View>
        <Text style={styles.jobName}>{item.job_name}</Text>
        <Text style={styles.jobDesc}>{item.description || '-'}</Text>
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
            <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '600' }}>Divisi</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Daftar Divisi</Text>
          <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '600', marginTop: 2 }}>
            {isAdmin ? 'Kelola struktur divisi perusahaan' : 'Daftar divisi aktif di perusahaan'}
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
          placeholder="Cari divisi atau perusahaan..."
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
          data={filteredJobs}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>
                {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : 'Belum ada data divisi.'}
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
              <Text style={styles.modalTitle}>{editingId ? 'Edit Divisi' : 'Tambah Divisi'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1e2022" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Perusahaan</Text>
              <TouchableOpacity 
                activeOpacity={0.7} 
                style={styles.selector} 
                onPress={() => {
                  setCompanySearch('');
                  setCompanyModalVisible(true);
                }}
              >
                <Text style={styles.selectorText}>
                  {formData.company_id ? getCompanyName(formData.company_id) : 'Pilih Perusahaan...'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nama Divisi</Text>
              <TextInput
                style={[styles.input, focusedField === 'job_name' && styles.inputFocused]}
                value={formData.job_name}
                onChangeText={(text) => setFormData({ ...formData, job_name: text })}
                onFocus={() => setFocusedField('job_name')}
                onBlur={() => setFocusedField(null)}
                placeholder="Contoh: Engineering, Product Design, Finance"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Deskripsi</Text>
              <TextInput
                style={[styles.input, styles.textArea, focusedField === 'description' && styles.inputFocused]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
                placeholder="Deskripsi peran dan tugas divisi..."
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

      {/* Company Selector Modal */}
      <Modal visible={companyModalVisible} transparent animationType="fade">
        <View style={styles.selectorOverlay}>
          <View style={styles.selectorContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Pilih Perusahaan</Text>
                <Text style={styles.modalSubtitle}>Ketik nama perusahaan untuk mencari</Text>
              </View>
              <TouchableOpacity onPress={() => setCompanyModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Live Search Input */}
            <View style={styles.modalSearchBar}>
              <Ionicons name="search-outline" size={18} color="#9ca3af" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Cari nama perusahaan..."
                placeholderTextColor="#9ca3af"
                value={companySearch}
                onChangeText={setCompanySearch}
                autoCorrect={false}
              />
              {companySearch.length > 0 && (
                <TouchableOpacity onPress={() => setCompanySearch('')} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredModalCompanies}
              keyExtractor={(item: any) => item.id.toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }: { item: any }) => {
                const isSelected = formData.company_id === item.id.toString();
                return (
                  <TouchableOpacity 
                    activeOpacity={0.7}
                    style={[styles.selectorItem, isSelected && styles.selectorItemSelected]} 
                    onPress={() => {
                      setFormData({ ...formData, company_id: item.id.toString() });
                      setCompanyModalVisible(false);
                    }}
                  >
                    <Text style={[styles.selectorItemText, isSelected && styles.selectorItemTextSelected]}>{item.company_name}</Text>
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
                    {companySearch ? `Perusahaan "${companySearch}" tidak ditemukan` : 'Belum ada data perusahaan.'}
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
  companyBadge: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  jobName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e2022',
    marginBottom: 6,
  },
  jobDesc: {
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
