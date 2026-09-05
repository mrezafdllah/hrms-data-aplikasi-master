import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import CustomAlert from '../../components/CustomAlert';

export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [positionModalVisible, setPositionModalVisible] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [positionSearch, setPositionSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState('');
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    role_id: '',
    position_id: '',
    full_name: '',
    email: '',
    hashed_password: '',
    status: 'Active'
  });

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

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
      if (storedRole) setCurrentUserRole(storedRole);

      api.get('/profile').then(r => {
        if (r.data?.data?.email) setCurrentUserEmail(r.data.data.email);
        if (r.data?.data?.role_name) setCurrentUserRole(r.data.data.role_name);
      }).catch(() => {});

      const [usersRes, rolesRes, positionsRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles'),
        api.get('/positions')
      ]);
      if (usersRes.data?.status === 'Success') setUsers(usersRes.data.data);
      if (rolesRes.data?.status === 'Success') setRoles(rolesRes.data.data);
      if (positionsRes.data?.status === 'Success') setPositions(positionsRes.data.data);
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
    if (!formData.full_name || !formData.email || (!editingId && !formData.hashed_password)) {
      showAlert('warning', 'Peringatan', 'Nama, Email, dan Password wajib diisi.');
      return;
    }

    showAlert(
      'confirm',
      editingId ? 'Konfirmasi Edit' : 'Konfirmasi Tambah',
      editingId 
        ? `Apakah Anda yakin ingin menyimpan perubahan data karyawan "${formData.full_name}"?`
        : `Apakah Anda yakin ingin menambahkan karyawan baru "${formData.full_name}"?`,
      () => executeSubmit()
    );
  };

  const executeSubmit = async () => {
    const payload = {
      ...formData,
      role_id: formData.role_id ? parseInt(formData.role_id) : null,
      position_id: formData.position_id ? parseInt(formData.position_id) : null,
    };

    if (editingId) {
      delete (payload as any).hashed_password;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, payload);
        showAlert('success', 'Sukses', 'User berhasil diperbarui.');
      } else {
        await api.post('/users', payload);
        showAlert('success', 'Sukses', 'User berhasil ditambahkan.');
      }
      setModalVisible(false);
      setEditingId(null);
      setFormData({ employee_id: '', role_id: '', position_id: '', full_name: '', email: '', hashed_password: '', status: 'Active' });
      fetchData();
    } catch (error: any) {
      showAlert('error', 'Error', error.response?.data?.detail || 'Gagal menyimpan data.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user: any) => {
    setFormData({
      employee_id: user.employee_id || '',
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
    showAlert(
      'delete',
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus user ini? Data yang dihapus tidak dapat dikembalikan.',
      async () => {
        try {
          await api.delete(`/users/${id}`);
          showAlert('success', 'Sukses', 'User berhasil dihapus.');
          fetchData();
        } catch (error) {
          showAlert('error', 'Error', 'Gagal menghapus user.');
        }
      }
    );
  };

  const openAddModal = () => {
    setFormData({ employee_id: '', role_id: '', position_id: '', full_name: '', email: '', hashed_password: '', status: 'Active' });
    setEditingId(null);
    setModalVisible(true);
  };

  const getRoleName = (roleId: string) => {
    const r: any = roles.find((item: any) => item.id.toString() === roleId);
    return r ? r.role_name : 'Pilih Role...';
  };

  const getPositionName = (posId: string) => {
    const p: any = positions.find((item: any) => item.id.toString() === posId);
    if (!p) return 'Pilih Divisi & Jabatan...';
    return p.job_name ? `${p.position_name} • Divisi: ${p.job_name}` : `${p.position_name} (${p.company_name || 'Perusahaan'})`;
  };

  const uniqueDivisions: string[] = Array.from(new Set(positions.map((p: any) => p.job_name).filter(Boolean)));

  const isAdmin = currentUserRole === 'Super Admin' || currentUserRole === 'Admin HR';

  const filteredUsers = users.filter((u: any) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = (u.full_name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const empId = (u.employee_id || '').toLowerCase();
    const pos = (u.position_name || '').toLowerCase();
    const role = (u.role_name || '').toLowerCase();
    const company = (u.company_name || '').toLowerCase();
    return name.includes(q) || email.includes(q) || empId.includes(q) || pos.includes(q) || role.includes(q) || company.includes(q);
  });

  const filteredModalRoles = roles
    .filter((r: any) => r.role_name !== 'Super Admin')
    .filter((r: any) => {
      if (!roleSearch.trim()) return true;
      return (r.role_name || '').toLowerCase().includes(roleSearch.toLowerCase().trim());
    });

  const filteredModalPositions = positions.filter((p: any) => {
    const q = positionSearch.toLowerCase().trim();
    const matchesDiv = !selectedDivisionFilter || p.job_name === selectedDivisionFilter;
    if (!matchesDiv) return false;
    if (!q) return true;
    const posName = (p.position_name || '').toLowerCase();
    const compName = (p.company_name || '').toLowerCase();
    const jobName = (p.job_name || '').toLowerCase();
    return posName.includes(q) || compName.includes(q) || jobName.includes(q);
  });

  const renderItem = ({ item }: { item: any }) => {
    const initials = item.full_name
      ? item.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
      : 'U';

    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <View style={styles.avatarInitial}>
              <Text style={styles.avatarInitialText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.headerRow}>
                <Text style={styles.userName}>{item.full_name}</Text>
                <Text style={[
                  styles.statusBadge, 
                  item.status === 'Active' ? styles.statusActive : styles.statusInactive
                ]}>
                  {item.status === 'Active' ? 'Aktif' : 'Nonaktif'}
                </Text>
              </View>
              <Text style={styles.userEmail}>{item.email}</Text>
            </View>
          </View>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <Ionicons name="card-outline" size={13} color="#f97316" />
              <Text style={[styles.metaText, { color: '#f97316', fontWeight: 'bold' }]}>{item.employee_id || `EMP-${item.id}`}</Text>
            </View>
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
          {item.email === currentUserEmail ? (
            <Text style={{ fontSize: 10, color: '#f97316', fontWeight: 'bold', backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
              👤 Anda
            </Text>
          ) : isAdmin ? (
            <>
              <TouchableOpacity activeOpacity={0.7} style={[styles.actionBtn, styles.editBtn]} onPress={() => handleEdit(item)}>
                <Ionicons name="create-outline" size={16} color="#f97316" />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ backgroundColor: '#f8fafc', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' }}>
              <Ionicons name="person-outline" size={14} color="#94a3b8" />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{isAdmin ? 'Manajemen User' : 'Rekan Kerja'}</Text>
          <Text style={styles.headerSubtitle}>
            {isAdmin ? 'Kelola pengguna dan hak akses' : 'Daftar seluruh rekan kerja & kontak tim'}
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
          placeholder={isAdmin ? "Cari nama, email, jabatan, ID..." : "Cari rekan kerja..."}
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
          data={filteredUsers}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>
                {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : 'Belum ada data user.'}
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
              <Text style={styles.modalTitle}>{editingId ? 'Edit User' : 'Tambah User'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1e2022" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>ID Karyawan</Text>
                <TextInput
                  style={[styles.input, focusedField === 'employee_id' && styles.inputFocused]}
                  value={formData.employee_id}
                  onChangeText={(text) => setFormData({ ...formData, employee_id: text })}
                  onFocus={() => setFocusedField('employee_id')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="EMP-001"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nama Lengkap</Text>
                <TextInput
                  style={[styles.input, focusedField === 'full_name' && styles.inputFocused]}
                  value={formData.full_name}
                  onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                  onFocus={() => setFocusedField('full_name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Nama Lengkap"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
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
                    style={[styles.input, focusedField === 'hashed_password' && styles.inputFocused]}
                    value={formData.hashed_password}
                    onChangeText={(text) => setFormData({ ...formData, hashed_password: text })}
                    onFocus={() => setFocusedField('hashed_password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Minimal 6 karakter"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                  />
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Role</Text>
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  style={styles.selector} 
                  onPress={() => {
                    setRoleSearch('');
                    setRoleModalVisible(true);
                  }}
                >
                  <Text style={styles.selectorText}>
                    {formData.role_id ? getRoleName(formData.role_id) : 'Pilih Role...'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Divisi & Jabatan</Text>
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  style={styles.selector} 
                  onPress={() => {
                    setPositionSearch('');
                    setSelectedDivisionFilter('');
                    setPositionModalVisible(true);
                  }}
                >
                  <Text style={styles.selectorText}>
                    {formData.position_id ? getPositionName(formData.position_id) : 'Pilih Divisi & Jabatan...'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.statusOptions}>
                  <TouchableOpacity 
                    activeOpacity={0.7}
                    style={[styles.statusOption, formData.status === 'Active' && styles.statusOptionActive]}
                    onPress={() => setFormData({ ...formData, status: 'Active' })}
                  >
                    <Text style={[styles.statusOptionText, formData.status === 'Active' && styles.statusOptionTextActive]}>Active</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    activeOpacity={0.7}
                    style={[styles.statusOption, formData.status === 'Inactive' && styles.statusOptionActiveRed]}
                    onPress={() => setFormData({ ...formData, status: 'Inactive' })}
                  >
                    <Text style={[styles.statusOptionText, formData.status === 'Inactive' && styles.statusOptionTextActiveRed]}>Inactive</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

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

      {/* Role Selector Modal */}
      <Modal visible={roleModalVisible} transparent animationType="fade">
        <View style={styles.selectorOverlay}>
          <View style={styles.selectorContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Pilih Role</Text>
                <Text style={styles.modalSubtitle}>Ketik nama role untuk mencari</Text>
              </View>
              <TouchableOpacity onPress={() => setRoleModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Live Search Input */}
            <View style={styles.modalSearchBar}>
              <Ionicons name="search-outline" size={18} color="#9ca3af" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Cari role..."
                placeholderTextColor="#9ca3af"
                value={roleSearch}
                onChangeText={setRoleSearch}
                autoCorrect={false}
              />
              {roleSearch.length > 0 && (
                <TouchableOpacity onPress={() => setRoleSearch('')} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredModalRoles}
              keyExtractor={(item: any) => item.id.toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }: { item: any }) => {
                const isSelected = formData.role_id === item.id.toString();
                return (
                  <TouchableOpacity 
                    activeOpacity={0.7}
                    style={[styles.selectorItem, isSelected && styles.selectorItemSelected]} 
                    onPress={() => {
                      setFormData({ ...formData, role_id: item.id.toString() });
                      setRoleModalVisible(false);
                    }}
                  >
                    <Text style={[styles.selectorItemText, isSelected && styles.selectorItemTextSelected]}>{item.role_name}</Text>
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
                    {roleSearch ? `Role "${roleSearch}" tidak ditemukan` : 'Belum ada data role.'}
                  </Text>
                </View>
              }
              style={{ maxHeight: 280 }}
            />
          </View>
        </View>
      </Modal>

      {/* Position Selector Modal */}
      <Modal visible={positionModalVisible} transparent animationType="fade">
        <View style={styles.selectorOverlay}>
          <View style={styles.selectorContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Pilih Divisi & Jabatan</Text>
                <Text style={styles.modalSubtitle}>Cari sesuai nama divisi atau jabatan</Text>
              </View>
              <TouchableOpacity onPress={() => setPositionModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Live Search Input */}
            <View style={styles.modalSearchBar}>
              <Ionicons name="search-outline" size={18} color="#9ca3af" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Cari divisi atau jabatan (contoh: IT, Manager)..."
                placeholderTextColor="#9ca3af"
                value={positionSearch}
                onChangeText={setPositionSearch}
                autoCorrect={false}
              />
              {positionSearch.length > 0 && (
                <TouchableOpacity onPress={() => setPositionSearch('')} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            {/* Division Filter Chips */}
            {uniqueDivisions.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={{ maxHeight: 38, marginBottom: 12 }} 
                contentContainerStyle={{ gap: 6, paddingHorizontal: 2 }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.divChip, !selectedDivisionFilter && styles.divChipActive]}
                  onPress={() => setSelectedDivisionFilter('')}
                >
                  <Text style={[styles.divChipText, !selectedDivisionFilter && styles.divChipTextActive]}>
                    Semua Divisi
                  </Text>
                </TouchableOpacity>
                {uniqueDivisions.map((div, i) => (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.7}
                    style={[styles.divChip, selectedDivisionFilter === div && styles.divChipActive]}
                    onPress={() => setSelectedDivisionFilter(selectedDivisionFilter === div ? '' : div)}
                  >
                    <Text style={[styles.divChipText, selectedDivisionFilter === div && styles.divChipTextActive]}>
                      {div}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <FlatList
              data={filteredModalPositions}
              keyExtractor={(item: any) => item.id.toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }: { item: any }) => {
                const isSelected = formData.position_id === item.id.toString();
                return (
                  <TouchableOpacity 
                    activeOpacity={0.7}
                    style={[styles.selectorItem, isSelected && styles.selectorItemSelected]} 
                    onPress={() => {
                      setFormData({ ...formData, position_id: item.id.toString() });
                      setPositionModalVisible(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        {item.job_name ? (
                          <View style={styles.divisionBadge}>
                            <Ionicons name="briefcase-outline" size={11} color="#ea580c" />
                            <Text style={styles.divisionBadgeText}>{item.job_name}</Text>
                          </View>
                        ) : null}
                        {item.company_name ? (
                          <Text style={styles.selectorItemSubtext}>{item.company_name}</Text>
                        ) : null}
                      </View>
                      <Text style={[styles.selectorItemText, isSelected && styles.selectorItemTextSelected]}>
                        {item.position_name}
                      </Text>
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
                    {positionSearch || selectedDivisionFilter 
                      ? `Tidak ada jabatan pada "${positionSearch || selectedDivisionFilter}"` 
                      : 'Belum ada data jabatan.'}
                  </Text>
                </View>
              }
              style={{ maxHeight: 300 }}
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
  headerSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    marginTop: 2,
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
    borderRadius: 22,
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
  avatarInitial: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f97316',
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
    backgroundColor: '#fff7ed',
    color: '#f97316',
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
  inputFocused: {
    borderColor: '#f97316',
    borderWidth: 1.5,
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
    backgroundColor: '#fff7ed',
    borderColor: '#f97316',
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
    color: '#f97316',
  },
  statusOptionTextActiveRed: {
    color: '#ef4444',
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
  divisionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  divisionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ea580c',
  },
  divChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  divChipActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  divChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  divChipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
