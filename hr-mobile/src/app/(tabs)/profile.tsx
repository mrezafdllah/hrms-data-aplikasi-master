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

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS_LIST = Array.from({ length: 66 }, (_, i) => (CURRENT_YEAR - 10) - i); // e.g. 2016 down to 1951

const formatDateIndonesian = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  try {
    const cleanStr = String(dateStr).split('T')[0].trim();
    if (!cleanStr || cleanStr === 'null' || cleanStr === 'undefined') return '-';
    
    const parts = cleanStr.split(/[-/]/);
    let d: Date;
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else if (parts[2].length === 4) {
        d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      } else {
        d = new Date(cleanStr);
      }
    } else {
      d = new Date(cleanStr);
    }
    
    if (isNaN(d.getTime())) return cleanStr;
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return String(dateStr || '-');
  }
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPositionPicker, setShowPositionPicker] = useState(false);

  // Date Picker Modal State
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [pickerYear, setPickerYear] = useState(1995);
  const [pickerMonth, setPickerMonth] = useState(1);
  const [pickerDay, setPickerDay] = useState(1);
  const [pickerTab, setPickerTab] = useState<'year' | 'month' | 'day'>('year');
  const [showManualDateInput, setShowManualDateInput] = useState(false);

  const openDatePicker = () => {
    let y = 1995;
    let m = 1;
    let d = 1;
    if (formData.birth_date) {
      const parts = String(formData.birth_date).split('T')[0].split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          y = parseInt(parts[0], 10) || 1995;
          m = parseInt(parts[1], 10) || 1;
          d = parseInt(parts[2], 10) || 1;
        } else if (parts[2].length === 4) {
          y = parseInt(parts[2], 10) || 1995;
          m = parseInt(parts[1], 10) || 1;
          d = parseInt(parts[0], 10) || 1;
        }
      }
    }
    setPickerYear(y);
    setPickerMonth(m);
    setPickerDay(d);
    setPickerTab('year');
    setShowDatePickerModal(true);
  };

  const applySelectedDate = () => {
    const maxDays = new Date(pickerYear, pickerMonth, 0).getDate();
    const safeDay = Math.min(pickerDay, maxDays);
    const formatted = `${pickerYear}-${String(pickerMonth).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
    setFormData(prev => ({ ...prev, birth_date: formatted }));
    setShowDatePickerModal(false);
  };

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

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
        setPasswordModalVisible(false);
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
  const isSuperAdmin = role === 'Super Admin';
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
      let cleanBirthDate = formData.birth_date ? formData.birth_date.trim() : null;
      if (cleanBirthDate) {
        const dmyMatch = cleanBirthDate.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
        if (dmyMatch) {
          cleanBirthDate = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
        }
      }

      const payload: any = {
        ...formData,
        birth_date: cleanBirthDate || null,
        position_id: formData.position_id ? parseInt(formData.position_id) : null,
      };
      if (!isSuperAdmin) {
        delete payload.employee_id;
      }
      if (!isAdmin) {
        delete payload.position_id;
      }
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
      const errorDetail = error.response?.data?.detail;
      const errorMessage = typeof errorDetail === 'string'
        ? errorDetail
        : Array.isArray(errorDetail)
        ? errorDetail.map((e: any) => e.msg || e.detail || JSON.stringify(e)).join('\n')
        : 'Terjadi kesalahan saat memperbarui profil';
      showAlert('error', 'Error', errorMessage);
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
      quality: 0.6,
      base64: true,
    });

    if (result.canceled) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      let dataUri = '';
      if (asset.base64) {
        const mimeType = asset.mimeType || 'image/jpeg';
        dataUri = asset.base64.startsWith('data:') 
          ? asset.base64 
          : `data:${mimeType};base64,${asset.base64}`;
      }

      let res;
      if (dataUri) {
        // Direct persistent update to profile
        res = await api.put('/profile', {
          ...formData,
          profile_picture: dataUri,
          birth_date: formData.birth_date || null,
          position_id: formData.position_id ? parseInt(formData.position_id) : null,
        });
      } else {
        // Fallback FormData upload via Axios
        const uploadData = new FormData();
        uploadData.append('file', {
          uri: asset.uri,
          name: asset.uri.split('/').pop() || 'photo.jpg',
          type: asset.mimeType || 'image/jpeg',
        } as any);
        res = await api.post('/upload-profile-picture', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (res.data?.status === 'Success') {
        fetchProfile();
        showAlert('success', 'Berhasil', t.uploadSuccess);
      } else {
        showAlert('error', 'Gagal', res.data?.detail || t.uploadFailed);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      showAlert('error', 'Error', error?.response?.data?.detail || 'Terjadi kesalahan saat mengunggah foto');
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
    const pic = formData.profile_picture || profile?.profile_picture;
    if (!pic) return null;
    if (pic.startsWith('data:image') || pic.startsWith('http')) {
      return pic;
    }
    const baseUrl = api.defaults.baseURL?.replace('/api', '') || '';
    return `${baseUrl}${pic}`;
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={styles.inputLabel}>{t.employeeId}</Text>
                  {!isSuperAdmin && (
                    <View style={styles.lockedBadge}>
                      <Ionicons name="lock-closed" size={10} color="#64748b" />
                      <Text style={styles.lockedBadgeText}>Terkunci (Diatur Admin)</Text>
                    </View>
                  )}
                </View>
                <TextInput
                  style={[
                    styles.textInput,
                    !isSuperAdmin && styles.disabledInput
                  ]}
                  value={formData.employee_id}
                  editable={isSuperAdmin}
                  onChangeText={txt => setFormData(prev => ({ ...prev, employee_id: txt }))}
                  placeholder="EMP-001"
                  placeholderTextColor="#9ca3af"
                />
                {!isSuperAdmin && (
                  <Text style={styles.fieldHelpText}>
                    ID Karyawan hanya dapat diubah oleh Super Admin/Admin HR melalui menu Manajemen Karyawan.
                  </Text>
                )}
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={styles.inputLabel}>{t.email}</Text>
                  {!isAdmin && (
                    <View style={styles.permanentBadge}>
                      <Text style={styles.permanentBadgeText}>Permanen</Text>
                    </View>
                  )}
                </View>
                <TextInput
                  style={[
                    styles.textInput,
                    !isAdmin && styles.disabledInput
                  ]}
                  value={formData.email}
                  editable={isAdmin}
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
                
                <TouchableOpacity
                  style={styles.dateSelectorBtn}
                  onPress={openDatePicker}
                  activeOpacity={0.7}
                >
                  <View style={styles.dateSelectorLeft}>
                    <View style={styles.dateIconWrapper}>
                      <Ionicons name="calendar" size={18} color="#f97316" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={formData.birth_date ? styles.dateSelectorValue : styles.dateSelectorPlaceholder}>
                        {formData.birth_date ? formatDateIndonesian(formData.birth_date) : "Pilih Tanggal Lahir"}
                      </Text>
                      {formData.birth_date ? (
                        <Text style={styles.dateIsoHint}>{formData.birth_date}</Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {formData.birth_date ? (
                      <TouchableOpacity
                        onPress={() => setFormData(prev => ({ ...prev, birth_date: '' }))}
                        style={styles.clearDateBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close-circle" size={18} color="#9ca3af" />
                      </TouchableOpacity>
                    ) : null}
                    <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                  </View>
                </TouchableOpacity>

                {/* Optional Manual Entry Toggle */}
                <TouchableOpacity
                  onPress={() => setShowManualDateInput(!showManualDateInput)}
                  style={styles.manualToggleBtn}
                >
                  <Ionicons name={showManualDateInput ? "chevron-up" : "create-outline"} size={12} color="#f97316" />
                  <Text style={styles.manualToggleText}>
                    {showManualDateInput ? "Tutup input manual" : "Atau ketik manual (YYYY-MM-DD)"}
                  </Text>
                </TouchableOpacity>

                {showManualDateInput && (
                  <TextInput
                    style={[styles.textInput, { marginTop: 4 }]}
                    value={formData.birth_date}
                    onChangeText={txt => setFormData(prev => ({ ...prev, birth_date: txt }))}
                    placeholder="YYYY-MM-DD (Contoh: 1995-05-15)"
                    placeholderTextColor="#9ca3af"
                  />
                )}
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
                  {profile.birth_date ? `, ${formatDateIndonesian(profile.birth_date)}` : ''}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t.address}</Text>
                <Text style={styles.detailValue}>{profile.address || '-'}</Text>
              </View>
              <View style={[styles.detailItem, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>{t.joinedSince}</Text>
                <Text style={styles.detailValue}>
                  {formatDateIndonesian(profile.joined_date || profile.created_at)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Security & Password Card / Menu Item */}
        <TouchableOpacity 
          style={[styles.securityCard, isEditing && { opacity: 0.6, backgroundColor: '#f8fafc' }]} 
          disabled={isEditing}
          onPress={() => {
            if (isEditing) return;
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordModalVisible(true);
          }}
        >
          <View style={styles.securityLeft}>
            <View style={[styles.securityIconContainer, isEditing && { backgroundColor: '#f1f5f9' }]}>
              <Ionicons name="key" size={20} color={isEditing ? "#94a3b8" : "#d97706"} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.securityTitle, isEditing && { color: '#94a3b8' }]}>Keamanan Akun & Sandi</Text>
                <View style={styles.securityBadge}>
                  <Text style={styles.securityBadgeText}>{isEditing ? "Terkunci saat Edit" : "Terlindungi"}</Text>
                </View>
              </View>
              <Text style={styles.securitySubtitle}>
                {isEditing ? "Selesaikan edit profil untuk ubah sandi" : "Perbarui kata sandi akun secara langsung"}
              </Text>
            </View>
          </View>
          <View style={styles.securityArrow}>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 6 }} />
          <Text style={styles.logoutBtnText}>{t.logoutBtn}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ====== MODAL: Change Password ====== */}
      <Modal visible={passwordModalVisible} transparent animationType="slide" onRequestClose={() => setPasswordModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.modalKeyIcon}>
                    <Ionicons name="key" size={16} color="#d97706" />
                  </View>
                  <Text style={styles.modalTitleText}>Perbarui Kata Sandi</Text>
                </View>
                <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#1e2022" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
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
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Ulangi kata sandi baru"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                      <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={18} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity 
                  style={styles.modalCancelBtnSoft} 
                  onPress={() => setPasswordModalVisible(false)}
                  disabled={passwordSaving}
                >
                  <Text style={styles.modalCancelBtnSoftText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalSubmitBtn} 
                  onPress={handlePasswordChange}
                  disabled={passwordSaving}
                >
                  {passwordSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Simpan Kata Sandi</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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

      {/* ====== MODAL: Date Picker ====== */}
      <Modal visible={showDatePickerModal} transparent animationType="slide" onRequestClose={() => setShowDatePickerModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '82%' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.dateIconWrapper}>
                  <Ionicons name="calendar" size={16} color="#f97316" />
                </View>
                <Text style={styles.modalTitleText}>Pilih Tanggal Lahir</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDatePickerModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={24} color="#1e2022" />
              </TouchableOpacity>
            </View>

            {/* Selected Date Preview Card */}
            <View style={styles.datePreviewCard}>
              <Text style={styles.datePreviewLabel}>Tanggal Terpilih</Text>
              <Text style={styles.datePreviewText}>
                {pickerDay} {MONTH_NAMES[pickerMonth - 1]} {pickerYear}
              </Text>
              <Text style={styles.datePreviewIso}>
                {pickerYear}-{String(pickerMonth).padStart(2, '0')}-{String(pickerDay).padStart(2, '0')}
              </Text>
            </View>

            {/* Picker Step Tabs: Tahun / Bulan / Tanggal */}
            <View style={styles.pickerTabsRow}>
              <TouchableOpacity
                style={[styles.pickerTabBtn, pickerTab === 'year' && styles.pickerTabBtnActive]}
                onPress={() => setPickerTab('year')}
              >
                <Text style={[styles.pickerTabBtnText, pickerTab === 'year' && styles.pickerTabBtnTextActive]}>
                  Tahun ({pickerYear})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerTabBtn, pickerTab === 'month' && styles.pickerTabBtnActive]}
                onPress={() => setPickerTab('month')}
              >
                <Text style={[styles.pickerTabBtnText, pickerTab === 'month' && styles.pickerTabBtnTextActive]}>
                  Bulan ({MONTH_SHORT[pickerMonth - 1]})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerTabBtn, pickerTab === 'day' && styles.pickerTabBtnActive]}
                onPress={() => setPickerTab('day')}
              >
                <Text style={[styles.pickerTabBtnText, pickerTab === 'day' && styles.pickerTabBtnTextActive]}>
                  Hari ({pickerDay})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab 1: Year Grid */}
            {pickerTab === 'year' && (
              <ScrollView style={styles.pickerScrollArea} showsVerticalScrollIndicator={false}>
                <View style={styles.gridContainer}>
                  {YEARS_LIST.map((yr) => (
                    <TouchableOpacity
                      key={yr}
                      style={[styles.gridChip, pickerYear === yr && styles.gridChipActive]}
                      onPress={() => {
                        setPickerYear(yr);
                        setPickerTab('month');
                      }}
                    >
                      <Text style={[styles.gridChipText, pickerYear === yr && styles.gridChipTextActive]}>
                        {yr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            {/* Tab 2: Month Grid */}
            {pickerTab === 'month' && (
              <ScrollView style={styles.pickerScrollArea} showsVerticalScrollIndicator={false}>
                <View style={styles.gridContainer}>
                  {MONTH_NAMES.map((name, idx) => {
                    const mNum = idx + 1;
                    return (
                      <TouchableOpacity
                        key={name}
                        style={[styles.monthChip, pickerMonth === mNum && styles.gridChipActive]}
                        onPress={() => {
                          setPickerMonth(mNum);
                          setPickerTab('day');
                        }}
                      >
                        <Text style={[styles.gridChipText, pickerMonth === mNum && styles.gridChipTextActive]}>
                          {name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {/* Tab 3: Day Grid */}
            {pickerTab === 'day' && (
              <ScrollView style={styles.pickerScrollArea} showsVerticalScrollIndicator={false}>
                <View style={styles.daysGridContainer}>
                  {Array.from({ length: new Date(pickerYear, pickerMonth, 0).getDate() }, (_, i) => i + 1).map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.dayChip, pickerDay === d && styles.gridChipActive]}
                      onPress={() => setPickerDay(d)}
                    >
                      <Text style={[styles.gridChipText, pickerDay === d && styles.gridChipTextActive]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            {/* Action Buttons */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtnSoft}
                onPress={() => {
                  setFormData(prev => ({ ...prev, birth_date: '' }));
                  setShowDatePickerModal(false);
                }}
              >
                <Text style={styles.modalCancelBtnSoftText}>Kosongkan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={applySelectedDate}
              >
                <Text style={styles.modalSubmitBtnText}>Terapkan Tanggal</Text>
              </TouchableOpacity>
            </View>
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
  disabledInput: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    color: '#64748b',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lockedBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
  },
  permanentBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  permanentBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#d97706',
  },
  fieldHelpText: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
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
  // Security Menu Card Styles
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  securityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  securityIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e2022',
  },
  securityBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  securityBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#059669',
  },
  securitySubtitle: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  securityArrow: {
    paddingLeft: 8,
  },
  // Modal Header & Buttons for Password Modal
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 12,
  },
  modalKeyIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e2022',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancelBtnSoft: {
    flex: 1,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnSoftText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalSubmitBtn: {
    flex: 2,
    backgroundColor: '#f97316',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  // Date Picker & Selector Styles
  dateSelectorBtn: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dateIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSelectorValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e2022',
  },
  dateSelectorPlaceholder: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },
  dateIsoHint: {
    fontSize: 10,
    fontWeight: '600',
    color: '#f97316',
    marginTop: 1,
  },
  clearDateBtn: {
    padding: 2,
  },
  manualToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  manualToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f97316',
  },
  datePreviewCard: {
    backgroundColor: '#fff7ed',
    borderColor: '#ffedd5',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  datePreviewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#c2410c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  datePreviewText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e2022',
    marginTop: 2,
  },
  datePreviewIso: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ea580c',
    marginTop: 2,
  },
  pickerTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  pickerTabBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerTabBtnActive: {
    backgroundColor: '#f97316',
  },
  pickerTabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
  },
  pickerTabBtnTextActive: {
    color: '#ffffff',
  },
  pickerScrollArea: {
    maxHeight: 200,
    marginVertical: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  gridChip: {
    width: '30%',
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthChip: {
    width: '47%',
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
    paddingVertical: 4,
  },
  dayChip: {
    width: '12%',
    aspectRatio: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridChipActive: {
    backgroundColor: '#f97316',
    borderColor: '#ea580c',
  },
  gridChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  gridChipTextActive: {
    color: '#ffffff',
  },
});
