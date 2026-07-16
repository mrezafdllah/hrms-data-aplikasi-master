import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert, TextInput, Image, Platform, KeyboardAvoidingView, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../utils/api';

const translations = {
  ID: {
    title: "Profil Saya",
    subtitle: "Informasi akun dan data pribadi Anda",
    editProfile: "Edit Profil",
    cancel: "Batal",
    save: "Simpan",
    successMsg: "Profil berhasil diperbarui",
    accountPositionInfo: "Informasi Akun & Jabatan",
    fullName: "Nama Lengkap",
    email: "Email",
    birthPlace: "Tempat Lahir",
    birthDate: "Tanggal Lahir",
    address: "Alamat",
    company: "Perusahaan (Company)",
    job: "Pekerjaan (Job)",
    position: "Jabatan (Position)",
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
    selectLanguage: "Pilih Bahasa / Language",
    permissionsDenied: "Izin Ditolak",
    galleryPermissionMsg: "Anda perlu memberikan izin akses galeri untuk mengunggah foto.",
    close: "Tutup",
    active: "Aktif",
    inactive: "Nonaktif",
    employee: "Karyawan",
  },
  EN: {
    title: "My Profile",
    subtitle: "Your account details and personal data",
    editProfile: "Edit Profile",
    cancel: "Cancel",
    save: "Save",
    successMsg: "Profile successfully updated",
    accountPositionInfo: "Account & Position Information",
    fullName: "Full Name",
    email: "Email",
    birthPlace: "Place of Birth",
    birthDate: "Date of Birth",
    address: "Address",
    company: "Company",
    job: "Job Name",
    position: "Position Title",
    joinedSince: "Member Since",
    uploadSuccess: "Profile picture successfully updated",
    uploadFailed: "Failed to upload profile picture",
    choosePosition: "Select Position",
    changePhoto: "Change Photo",
    uploading: "Uploading...",
    placeholderAddress: "Enter your full home address",
    placeholderBirthPlace: "Example: Jakarta",
    loadingMsg: "Loading Profile...",
    notFoundMsg: "Profile data not found.",
    confirmTitle: "Confirmation",
    confirmLogoutMsg: "Are you sure you want to logout?",
    cancelBtn: "Cancel",
    logoutBtn: "Logout Session",
    selectLanguage: "Select Language / Bahasa",
    permissionsDenied: "Permissions Denied",
    galleryPermissionMsg: "You need to grant gallery access permission to upload photo.",
    close: "Close",
    active: "Active",
    inactive: "Inactive",
    employee: "Employee",
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
  const [language, setLanguage] = useState<'ID' | 'EN'>('ID');
  const router = useRouter();

  const [formData, setFormData] = useState({
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
  const t = translations[language];

  const loadLang = useCallback(async () => {
    const lang = await AsyncStorage.getItem('language');
    if (lang === 'EN') setLanguage('EN');
    else setLanguage('ID');
  }, []);

  const toggleLanguage = async (newLang: 'ID' | 'EN') => {
    setLanguage(newLang);
    await AsyncStorage.setItem('language', newLang);
  };

  const fetchProfile = useCallback(() => {
    setLoading(true);
    api.get('/profile')
      .then((res) => {
        if (res.data?.status === 'Success') {
          const data = res.data.data;
          setProfile(data);
          setFormData({
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
    loadLang();
    fetchProfile();
    fetchPositions();
  }, [loadLang, fetchProfile, fetchPositions]);

  const handleLogout = async () => {
    Alert.alert(t.confirmTitle, t.confirmLogoutMsg, [
      { text: t.cancelBtn, style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace('/login');
        }
      }
    ]);
  };

  const handleSave = async () => {
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
        Alert.alert(language === 'ID' ? 'Berhasil' : 'Success', t.successMsg);
        setIsEditing(false);
        fetchProfile();
      } else {
        Alert.alert(language === 'ID' ? 'Gagal' : 'Failed', res.data?.detail || 'Gagal memperbarui profil');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t.permissionsDenied, t.galleryPermissionMsg);
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
        Alert.alert(language === 'ID' ? 'Berhasil' : 'Success', t.uploadSuccess);
      } else {
        Alert.alert(language === 'ID' ? 'Gagal' : 'Failed', t.uploadFailed);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat mengunggah foto');
    } finally {
      setUploading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    if (profile) {
      setFormData({
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
        <ActivityIndicator size="large" color="#7b3fe4" />
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

        {/* Language Selection Card */}
        {!isEditing && (
          <View style={styles.profileCard}>
            <Text style={styles.sectionTitle}>{t.selectLanguage}</Text>
            <View style={styles.languageRow}>
              <TouchableOpacity
                style={[styles.langBtn, language === 'ID' && styles.langBtnActive]}
                onPress={() => toggleLanguage('ID')}
              >
                <Text style={[styles.langBtnText, language === 'ID' && styles.langBtnTextActive]}>🇮🇩 Indonesia</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langBtn, language === 'EN' && styles.langBtnActive]}
                onPress={() => toggleLanguage('EN')}
              >
                <Text style={[styles.langBtnText, language === 'EN' && styles.langBtnTextActive]}>🇬🇧 English</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Detail Profil Card */}
        <View style={styles.profileCard}>
          <Text style={styles.sectionTitle}>{t.accountPositionInfo}</Text>

          {isEditing ? (
            <View style={styles.formContainer}>
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
                  {profile.birth_date ? `, ${new Date(profile.birth_date).toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t.address}</Text>
                <Text style={styles.detailValue}>{profile.address || '-'}</Text>
              </View>
              <View style={[styles.detailItem, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>{t.joinedSince}</Text>
                <Text style={styles.detailValue}>
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                </Text>
              </View>
            </View>
          )}
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
                    <Text style={[styles.userOptionText, String(p.id) === String(formData.position_id) && { color: '#7b3fe4' }]}>
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
    backgroundColor: '#7b3fe4',
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
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ede9fe',
  },
  avatarText: {
    color: '#7b3fe4',
    fontSize: 38,
    fontWeight: 'bold',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#7b3fe4',
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
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#7b3fe4',
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
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7b3fe4',
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
    backgroundColor: '#7b3fe4',
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  langBtnTextActive: {
    color: '#ffffff',
  },
});
