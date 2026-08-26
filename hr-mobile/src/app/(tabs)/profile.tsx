import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert, TextInput, Image, Platform, KeyboardAvoidingView, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../utils/api';
import CustomAlert from '../../components/CustomAlert';

const t = {
  title: "Profil Saya",
  subtitle: "Informasi akun dan data pribadi Anda",
  editProfile: "Edit Profil",
  cancel: "Batal",
  save: "Simpan",
  successMsg: "Profil berhasil diperbarui",
  accountPositionInfo: "Informasi Akun & Jabatan",
  employeeId: "ID Karyawan",
  fullName: "Nama Lengkap",
  email: "Email",
  birthPlace: "Tempat Lahir",
  birthDate: "Tanggal Lahir",
  address: "Alamat",
  company: "Perusahaan",
  job: "Pekerjaan",
  position: "Jabatan",
  joinedSince: "Bergabung Sejak",
  uploadSuccess: "Foto profil berhasil diperbarui",
  uploadFailed: "Gagal mengunggah foto profil",
  choosePosition: "Pilih Jabatan",
  changePhoto: "Ganti Foto",
  uploading: "Mengunggah...",
  placeholderAddress: "Masukkan alamat lengkap rumah Anda",
  placeholderBirthPlace: "Contoh: Jakarta",
  loadingMsg: "Memuat Profil...",
  notFoundMsg: "Data profil tidak ditemukan.",
  confirmTitle: "Konfirmasi",
  confirmLogoutMsg: "Apakah Anda yakin ingin logout?",
  cancelBtn: "Batal",
  logoutBtn: "Logout Sesi",
  permissionsDenied: "Izin Ditolak",
  galleryPermissionMsg: "Anda perlu memberikan izin akses galeri untuk mengunggah foto.",
  close: "Tutup",
  active: "Aktif",
  inactive: "Nonaktif",
  employee: "Karyawan",
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPositionPicker, setShowPositionPicker] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<any>({ type: 'info', title: '', message: '' });

  const showAlert = (type: string, title: string, message: string, onConfirm?: () => void) => {
    setAlertConfig({ type, title, message, onConfirm });
    setAlertVisible(true);
  };
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert('warning', 'Input Tidak Lengkap', 'Harap isi semua kolom kata sandi.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('warning', 'Konfirmasi Salah', 'Kata sandi baru dan konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (newPassword.length < 6) {
      showAlert('warning', 'Kata Sandi Lemah', 'Kata sandi baru minimal 6 karakter.');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await api.post('/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      if (res.data?.status === 'Success') {
        showAlert('success', 'Berhasil', 'Kata sandi Anda berhasil diperbarui.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showAlert('error', 'Gagal', res.data?.detail || 'Gagal mengubah kata sandi');
      }
    } catch (error: any) {
      showAlert('error', 'Gagal', error.response?.data?.detail || 'Terjadi kesalahan');
    } finally {
      setPasswordSaving(false);
    }
  };

  const [formData, setFormData] = useState({
    employee_id: '',
    full_name: '',
    email: '',
    birth_place: '',
    birth_date: '',
    address: '',
    profile_picture: '',
    position_id: '',
  });

  const role = profile?.role_name || '';
  const isAdmin = role === 'Super Admin' || role === 'Admin HR';

  const fetchProfile = useCallback(() => {
    setLoading(true);
    api.get('/profile')
      .then((res) => {
        if (res.data?.status === 'Success') {
          const data = res.data.data;
          setProfile(data);
          setFormData({
            employee_id: data.employee_id || '',
            full_name: data.full_name || '',
            email: data.email || '',
            birth_place: data.birth_place || '',
            birth_date: data.birth_date ? data.birth_date.split('T')[0] : '',
            address: data.address || '',
            profile_picture: data.profile_picture || '',
            position_id: data.position_id ? String(data.position_id) : '',
          });
        }
        setLoading(false);
      })
      .catch((error: any) => {
        if (error?.response?.status === 401) return;
        console.error('Error profile:', error);
        setLoading(false);
      });
  }, []);

  const fetchPositions = useCallback(() => {
    api.get('/positions')
      .then((res) => {
        if (res.data?.status === 'Success') {
          setPositions(res.data.data);
        }
      })
      .catch((error: any) => {
        if (error?.response?.status === 401) return;
        console.error('Error positions:', error);
      });
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchPositions();
  }, [fetchProfile, fetchPositions]);

  const handleLogout = async () => {
    showAlert(
      'delete',
      t.confirmTitle,
      t.confirmLogoutMsg,
      async () => {
        await AsyncStorage.clear();
        router.replace('/login');
      }
    );
  };

  const handleSave = async () => {
    showAlert(
      'confirm',
      'Konfirmasi Perubahan',
      'Apakah Anda yakin ingin menyimpan perubahan profil Anda?',
      () => executeSave()
    );
  };

  const executeSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        birth_date: formData.birth_date || null,
        position_id: formData.position_id ? parseInt(formData.position_id) : null,
      };
      const res = await api.put('/profile', payload);
      if (res.data?.status === 'Success') {
        await AsyncStorage.setItem('name', formData.full_name);
        showAlert('success', 'Berhasil', t.successMsg);
        setIsEditing(false);
        fetchProfile();
      } else {
        showAlert('error', 'Gagal', res.data?.detail || 'Gagal memperbarui profil');
      }
    } catch (error: any) {
      showAlert('error', 'Error', error.response?.data?.detail || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert('warning', t.permissionsDenied, t.galleryPermissionMsg);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const fileUri = asset.uri;
      const fileName = fileUri.split('/').pop() || 'photo.jpg';
      const fileType = asset.mimeType || 'image/jpeg';

      const uploadData = new FormData();
      uploadData.append('file', {
        uri: fileUri,
        name: fileName,
        type: fileType,
      } as any);

      const token = await AsyncStorage.getItem('token');
      const baseUrl = api.defaults.baseURL?.replace('/api', '') || '';
      const uploadRes = await fetch(`${baseUrl}/api/upload-profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadData,
      });
      const uploadJson = await uploadRes.json();

      if (uploadJson.status === 'Success') {
        const newPicturePath = uploadJson.file_path;
        setFormData(prev => ({ ...prev, profile_picture: newPicturePath }));

        // Also save to backend profile immediately
        const updatePayload = {
          ...formData,
          profile_picture: newPicturePath,
          position_id: formData.position_id ? parseInt(formData.position_id) : null
        };
        await api.put('/profile', updatePayload);
        fetchProfile();
        showAlert('success', 'Berhasil', t.uploadSuccess);
      } else {
        showAlert('error', 'Gagal', t.uploadFailed);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      showAlert('error', 'Error', 'Terjadi kesalahan saat mengunggah foto');
    } finally {
      setUploading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    if (profile) {
      setFormData({
        employee_id: profile.employee_id || '',
        full_name: profile.full_name || '',
        email: profile.email || '',
        birth_place: profile.birth_place || '',
        birth_date: profile.birth_date ? profile.birth_date.split('T')[0] : '',
        address: profile.address || '',
        profile_picture: profile.profile_picture || '',
        position_id: profile.position_id ? String(profile.position_id) : '',
      });
    }
  };

  const getProfileImageUrl = () => {
    if (!formData.profile_picture) return null;
    const baseUrl = api.defaults.baseURL?.replace('/api', '') || '';
    return `${baseUrl}${formData.profile_picture}`;
  };

  const getSelectedPositionName = () => {
    const pos = positions.find(p => String(p.id) === String(formData.position_id));
    return pos ? `${pos.position_name} (${pos.job_name || '-'})` : t.choosePosition;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>{t.loadingMsg}</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{t.notFoundMsg}</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>{t.logoutBtn}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imageUrl = getProfileImageUrl();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t.title}</Text>
          {!isEditing && (
            <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={styles.editBtnText}>{t.editProfile}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickImage} disabled={uploading}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={{ marginTop: 10 }}>
            <Text style={styles.fullName}>{profile.full_name}</Text>
            <Text style={styles.emailText}>{profile.email}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.statusBadge, profile.status === 'Active' ? styles.statusActive : styles.statusInactive]}>
                <Text style={[styles.statusBadgeText, profile.status === 'Active' ? styles.statusActiveText : styles.statusInactiveText]}>
                  {profile.status === 'Active' ? t.active : t.inactive}
                </Text>
              </View>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {profile.role_name === 'Karyawan' ? t.employee : profile.role_name}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Detail Profil Card */}
        <View style={styles.profileCard}>
          <Text style={styles.sectionTitle}>{t.accountPositionInfo}</Text>

          {isEditing ? (
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.employeeId}</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.employee_id}
                  onChangeText={txt => setFormData(prev => ({ ...prev, employee_id: txt }))}
                  placeholder="EMP-001"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.fullName}</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.full_name}
                  onChangeText={txt => setFormData(prev => ({ ...prev, full_name: txt }))}
                  placeholder={t.fullName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.email}</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.email}
                  onChangeText={txt => setFormData(prev => ({ ...prev, email: txt }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.birthPlace}</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.birth_place}
                  onChangeText={txt => setFormData(prev => ({ ...prev, birth_place: txt }))}
                  placeholder={t.placeholderBirthPlace}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.birthDate}</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.birth_date}
                  onChangeText={txt => setFormData(prev => ({ ...prev, birth_date: txt }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.address}</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.address}
                  onChangeText={txt => setFormData(prev => ({ ...prev, address: txt }))}
                  placeholder={t.placeholderAddress}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {isAdmin && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.position}</Text>
                  <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowPositionPicker(true)}>
                    <Text style={styles.pickerBtnText}>
                      {getSelectedPositionName()}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit}>
                  <Ionicons name="close-outline" size={16} color="#6b7280" />
                  <Text style={styles.cancelBtnText}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-outline" size={16} color="#fff" />
                      <Text style={styles.saveBtnText}>{t.save}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // ===== VIEW MODE =====
            <View style={styles.detailsContainer}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t.employeeId}</Text>
                <Text style={styles.detailValue}>{profile.employee_id || `EMP-${profile.id}`}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t.company}</Text>
                <Text style={styles.detailValue}>{profile.company_name || '-'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t.job}</Text>
                <Text style={styles.detailValue}>{profile.job_name || '-'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t.position}</Text>
                <Text style={styles.detailValue}>{profile.position_name || '-'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t.birthPlace}, {t.birthDate}</Text>
                <Text style={styles.detailValue}>
                  {profile.birth_place || '-'}
                  {profile.birth_date ? `, ${new Date(profile.birth_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t.address}</Text>
                <Text style={styles.detailValue}>{profile.address || '-'}</Text>
              </View>
              <View style={[styles.detailItem, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>{t.joinedSince}</Text>
                <Text style={styles.detailValue}>
                  {(profile.joined_date || profile.created_at) ? new Date(profile.joined_date || profile.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Change Password Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="key-outline" size={18} color="#d97706" style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Keamanan Akun & Kata Sandi</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kata Sandi Saat Ini</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Masukkan kata sandi saat ini"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeBtn}>
                <Ionicons name={showCurrentPassword ? "eye-outline" : "eye-off-outline"} size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kata Sandi Baru</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Minimal 6 karakter"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeBtn}>
                <Ionicons name={showNewPassword ? "eye-outline" : "eye-off-outline"} size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Konfirmasi Kata Sandi Baru</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ulangi kata sandi baru"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showNewPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity style={styles.passwordSaveBtn} onPress={handlePasswordChange} disabled={passwordSaving}>
            {passwordSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="key" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Perbarui Kata Sandi</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 6 }} />
          <Text style={styles.logoutBtnText}>{t.logoutBtn}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ====== MODAL: Position Picker ====== */}
      <Modal visible={showPositionPicker} transparent animationType="slide" onRequestClose={() => setShowPositionPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '60%' }]}>
            <Text style={styles.modalTitle}>{t.choosePosition}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {positions.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.userOption, String(p.id) === String(formData.position_id) && styles.userOptionSelected]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, position_id: String(p.id) }));
                    setShowPositionPicker(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userOptionText, String(p.id) === String(formData.position_id) && { color: '#f97316' }]}>
                      {p.position_name}
                    </Text>
                    <Text style={styles.userOptionRole}>{p.job_name || '-'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPositionPicker(false)}>
              <Text style={styles.modalCancelText}>{t.close}</Text>
            </TouchableOpacity>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fbfd',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  headerRow: {
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
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  editBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fbfd',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fbfd',
    padding: 30,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  // Avatar Card
  avatarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#f3f4f6',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffedd5',
  },
  avatarText: {
    color: '#f97316',
    fontSize: 38,
    fontWeight: 'bold',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#f97316',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  fullName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e2022',
    textAlign: 'center',
  },
  emailText: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusActive: {
    backgroundColor: '#ecfdf5',
  },
  statusActiveText: {
    color: '#059669',
  },
  statusInactive: {
    backgroundColor: '#fef2f2',
  },
  statusInactiveText: {
    color: '#ef4444',
  },
  roleBadge: {
    backgroundColor: '#fff7ed',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#f97316',
  },
  // Profile Details Card
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e2022',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 12,
    marginBottom: 16,
  },
  detailsContainer: {
    gap: 14,
  },
  detailItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#fafafa',
    paddingBottom: 10,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e2022',
    marginTop: 4,
  },
  // Edit Form
  formContainer: {
    gap: 14,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  textArea: {
    minHeight: 70,
  },
  pickerBtn: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 14,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#fee2e2',
    paddingVertical: 14,
    borderRadius: 16,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Modal Picker styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e2022',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 12,
  },
  modalCancelBtn: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
  },
  userOption: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userOptionSelected: {
    backgroundColor: '#f5f3ff',
    borderRadius: 10,
  },
  userOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  userOptionRole: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 2,
  },
  // Language button styles
  languageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtnActive: {
    backgroundColor: '#f97316',
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  langBtnTextActive: {
    color: '#ffffff',
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1f2937',
  },
  eyeBtn: {
    padding: 6,
  },
  passwordSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e2022',
  },
});
