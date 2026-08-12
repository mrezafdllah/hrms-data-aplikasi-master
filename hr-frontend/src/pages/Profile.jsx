import { apiFetch, API_BASE_URL } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { UserCircle, Camera, Check, X, Edit3, AlertTriangle, Key, Eye, EyeOff } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

const t = {
  title: "Profil Saya",
  subtitle: "Informasi akun dan data pribadi Anda",
  editProfile: "Edit Profil",
  cancel: "Batal",
  saveChanges: "Simpan Perubahan",
  successMsg: "Profil berhasil diperbarui!",
  accountPositionInfo: "Informasi Akun & Jabatan",
  employeeId: "ID Karyawan",
  fullName: "Nama Lengkap",
  email: "Email",
  birthPlace: "Tempat Lahir",
  birthDate: "Tanggal Lahir",
  address: "Alamat",
  company: "Perusahaan",
  job: "Divisi",
  position: "Jabatan",
  joinedSince: "Bergabung Sejak",
  uploadSuccess: "Foto profil berhasil diperbarui!",
  uploadFailed: "Gagal mengunggah foto profil.",
  choosePosition: "Pilih Jabatan (Khusus Admin)",
  changePhoto: "Ganti Foto",
  uploading: "Mengunggah...",
  placeholderAddress: "Masukkan alamat lengkap rumah Anda",
  placeholderBirthPlace: "Contoh: Jakarta",
  loadingMsg: "Memuat Profil...",
  notFoundMsg: "Data profil tidak ditemukan.",
};

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const [alertModal, setAlertModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'error'
  });

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'update',
    onConfirm: null
  });

  const showAlert = (title, message, type = 'error') => {
    setAlertModal({
      show: true,
      title,
      message,
      type
    });
  };

  const formatErrorDetail = (detail) => {
    if (!detail) return 'Terjadi kesalahan pada data';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map(err => {
        const field = err.loc && err.loc.length > 1 ? err.loc[1] : '';
        const fieldName = {
          full_name: 'Nama Lengkap',
          email: 'Email',
          birth_place: 'Tempat Lahir',
          birth_date: 'Tanggal Lahir',
          address: 'Alamat',
          position_id: 'Jabatan'
        }[field] || field;

        return `${fieldName ? fieldName + ': ' : ''}${err.msg}`;
      }).join('\n');
    }
    return JSON.stringify(detail);
  };

  const [formData, setFormData] = useState({
    employee_id: '',
    full_name: '',
    email: '',
    birth_place: '',
    birth_date: '',
    address: '',
    profile_picture: '',
    position_id: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      showAlert('Input Tidak Lengkap', 'Harap isi semua kolom kata sandi.');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      showAlert('Konfirmasi Salah', 'Kata sandi baru dan konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (passwordData.new_password.length < 6) {
      showAlert('Kata Sandi Lemah', 'Kata sandi baru minimal 6 karakter.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await apiFetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      });

      const data = await res.json();

      if (res.ok && data.status === 'Success') {
        showAlert('Berhasil!', 'Kata sandi Anda berhasil diperbarui.', 'success');
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        showAlert('Gagal Mengubah Kata Sandi', data.detail || 'Terjadi kesalahan');
      }
    } catch (err) {
      showAlert('Gagal Mengubah Kata Sandi', err.message || 'Terjadi kesalahan koneksi');
    } finally {
      setPasswordLoading(false);
    }
  };

  const role = localStorage.getItem('role');
  const isAdmin = role === 'Super Admin' || role === 'Admin HR';

  const fetchProfile = () => {
    setLoading(true);
    apiFetch('/api/profile')
      .then(res => res.json())
      .then((data) => {
        if (data.status === "Success") {
          setProfile(data.data);
          setFormData({
            employee_id: data.data.employee_id || '',
            full_name: data.data.full_name || '',
            email: data.data.email || '',
            birth_place: data.data.birth_place || '',
            birth_date: data.data.birth_date ? data.data.birth_date.split('T')[0] : '',
            address: data.data.address || '',
            profile_picture: data.data.profile_picture || '',
            position_id: data.data.position_id || '',
            joined_date: data.data.joined_date ? data.data.joined_date.split('T')[0] : ''
          });
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setLoading(false);
      });
  };

  const fetchPositions = () => {
    if (isAdmin) {
      apiFetch('/api/positions')
        .then(res => res.json())
        .then(data => {
          if (data.status === 'Success') setPositions(data.data);
        })
        .catch(err => console.error(err));
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchPositions();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showAlert(
        'Format Tidak Didukung',
        'Format file tidak didukung. Gunakan JPG, JPEG, PNG, atau WEBP.',
        'error'
      );
      return;
    }

    // Validate file size (Max 2MB)
    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      showAlert(
        'File Terlalu Besar',
        'Ukuran foto maksimal adalah 2MB.',
        'error'
      );
      return;
    }

    const fileForm = new FormData();
    fileForm.append('file', file);

    setUploading(true);
    apiFetch('/api/profile/upload-photo', {
      method: 'POST',
      body: fileForm
    })
      .then(res => res.json())
      .then((data) => {
        setUploading(false);
        if (data.status === "Success") {
          setMessage(t.uploadSuccess);
          fetchProfile();
          setTimeout(() => setMessage(''), 3000);
        } else {
          showAlert('Gagal Unggah', data.detail || t.uploadFailed, 'error');
        }
      })
      .catch(err => {
        setUploading(false);
        console.error(err);
        showAlert('Gagal Unggah', t.uploadFailed, 'error');
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'position_id' ? (value ? parseInt(value) : '') : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmModal({
      show: true,
      title: 'Konfirmasi Perubahan',
      message: 'Apakah Anda yakin ingin menyimpan perubahan profil Anda?',
      type: 'update',
      onConfirm: () => executeSubmit()
    });
  };

  const executeSubmit = () => {
    const payload = { ...formData };
    if (!isAdmin) {
      delete payload.position_id;
      delete payload.employee_id;
    } else {
      payload.position_id = payload.position_id === "" ? null : parseInt(payload.position_id);
    }
    
    // Sanitize empty strings to null for strict schema types (like Optional[date] or Optional[int])
    payload.birth_date = payload.birth_date === "" ? null : payload.birth_date;
    payload.birth_place = payload.birth_place === "" ? null : payload.birth_place;
    payload.address = payload.address === "" ? null : payload.address;
    payload.profile_picture = payload.profile_picture === "" ? null : payload.profile_picture;

    apiFetch('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then((data) => {
        if (data.status === "Success") {
          showAlert('Berhasil', t.successMsg, 'success');
          setIsEditing(false);
          fetchProfile();
        } else {
          showAlert('Gagal Perbarui', formatErrorDetail(data.detail), 'error');
        }
      })
      .catch(err => {
        console.error(err);
        showAlert('Error', 'Terjadi kesalahan saat menyimpan', 'error');
      });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-semibold text-gray-500 bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#7b3fe4] border-t-transparent rounded-full animate-spin"></div>
          <span>{t.loadingMsg}</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="flex h-64 items-center justify-center text-gray-500">{t.notFoundMsg}</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. TOP HEADER PANEL */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-50 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">{t.title}</h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">{t.subtitle}</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] text-white font-bold text-xs py-2.5 px-5 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/10 hover:shadow-lg transition-all cursor-pointer"
          >
            <Edit3 size={14} /> {t.editProfile}
          </button>
        )}
      </div>

      {message && (
        <div className="bg-emerald-50 text-emerald-700 text-xs font-bold p-4 rounded-xl border border-emerald-100 animate-fade-in flex items-center gap-2">
          <Check size={16} /> {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Foto Profil Card */}
        <div className="bg-white rounded-2xl border border-gray-50 shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <div className="relative group w-32 h-32 rounded-full shadow-inner border-2 border-gray-100 flex items-center justify-center overflow-hidden bg-purple-50">
            {formData.profile_picture ? (
              <img 
                src={`${API_BASE_URL}${formData.profile_picture}`} 
                alt="Foto Profil" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-5xl font-black text-[#7b3fe4]">
                {profile.full_name?.charAt(0)?.toUpperCase()}
              </span>
            )}
            
            <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[10px] font-bold">
              <Camera size={20} className="mb-1" />
              <span>{uploading ? t.uploading : t.changePhoto}</span>
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/webp" 
                onChange={handleFileChange} 
                className="hidden" 
                disabled={uploading}
              />
            </label>
          </div>
          
          <div className="mt-4">
            <h2 className="text-lg font-bold text-gray-800">{profile.full_name}</h2>
            <p className="text-gray-400 text-xs font-semibold">{profile.email}</p>
            <div className="flex gap-2 justify-center mt-3">
              <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full ${
                profile.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                {profile.status === 'Active' ? 'Aktif' : 'Nonaktif'}
              </span>
              <span className="px-2.5 py-0.5 text-[9px] font-bold rounded-full bg-purple-50 text-[#7b3fe4]">
                {profile.role_name || 'Karyawan'}
              </span>
            </div>
          </div>
        </div>

        {/* Detail Profil Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-50 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-3 mb-4">{t.accountPositionInfo}</h3>
          
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t.employeeId}</label>
                    {!isAdmin && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Permanen</span>
                    )}
                  </div>
                  <input
                    type="text"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleChange}
                    disabled={!isAdmin}
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                      !isAdmin 
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed select-none' 
                        : 'bg-gray-50 border-gray-100 text-gray-700 focus:outline-none focus:border-[#7b3fe4] focus:bg-white'
                    }`}
                    placeholder="EMP-001"
                    title={!isAdmin ? "ID Karyawan hanya dapat diubah oleh Admin / Super Admin" : "Masukkan ID Karyawan"}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{t.fullName}</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#7b3fe4] focus:bg-white transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{t.email}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#7b3fe4] focus:bg-white transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{t.birthPlace}</label>
                  <input
                    type="text"
                    name="birth_place"
                    value={formData.birth_place}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#7b3fe4] focus:bg-white transition-all"
                    placeholder={t.placeholderBirthPlace}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{t.birthDate}</label>
                  <input
                    type="date"
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#7b3fe4] focus:bg-white transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{t.address}</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#7b3fe4] focus:bg-white transition-all resize-none"
                    placeholder={t.placeholderAddress}
                  />
                </div>

                {isAdmin && (
                  <>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{t.position}</label>
                      <select
                        name="position_id"
                        value={formData.position_id}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#7b3fe4] focus:bg-white transition-all"
                      >
                        <option value="">{t.choosePosition}</option>
                        {positions.map(p => (
                          <option key={p.id} value={p.id}>{p.position_name} ({p.job_name || '-'})</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{t.joinedSince}</label>
                      <input
                        type="date"
                        name="joined_date"
                        value={formData.joined_date}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#7b3fe4] focus:bg-white transition-all"
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex gap-2 justify-end pt-3 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      full_name: profile.full_name || '',
                      email: profile.email || '',
                      birth_place: profile.birth_place || '',
                      birth_date: profile.birth_date ? profile.birth_date.split('T')[0] : '',
                      address: profile.address || '',
                      profile_picture: profile.profile_picture || '',
                      position_id: profile.position_id || '',
                      joined_date: profile.joined_date ? profile.joined_date.split('T')[0] : (profile.created_at ? profile.created_at.split('T')[0] : '')
                    });
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                >
                  <X size={14} /> {t.cancel}
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1 shadow-md shadow-blue-500/10 hover:shadow-lg transition-all cursor-pointer"
                >
                  <Check size={14} /> {t.saveChanges}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6 text-xs font-semibold text-gray-500">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.employeeId}</label>
                <p className="text-gray-800 font-bold mt-1 text-sm">{profile.employee_id || `EMP-${profile.id}`}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.company}</label>
                <p className="text-gray-800 font-bold mt-1 text-sm">{profile.company_name || '-'}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.job}</label>
                <p className="text-gray-800 font-bold mt-1 text-sm">{profile.job_name || '-'}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.position}</label>
                <p className="text-gray-800 font-bold mt-1 text-sm">{profile.position_name || '-'}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.birthPlace}, {t.birthDate}</label>
                <p className="text-gray-800 font-bold mt-1 text-sm">
                  {profile.birth_place || '-'}
                  {profile.birth_date ? `, ${new Date(profile.birth_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.address}</label>
                <p className="text-gray-800 font-bold mt-1 text-sm leading-relaxed">{profile.address || '-'}</p>
              </div>
              <div className="md:col-span-2 pt-3 border-t border-gray-50">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.joinedSince}</label>
                <p className="text-gray-800 font-bold mt-1 text-sm">
                  {(profile.joined_date || profile.created_at) ? new Date(profile.joined_date || profile.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. UBAH KATA SANDI CARD */}
      <div className="bg-white rounded-2xl border border-gray-50 p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-50 pb-4 mb-6">
          <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
            <Key size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-800 text-sm">Keamanan Akun & Kata Sandi</h3>
            <p className="text-[10px] font-semibold text-gray-400">Perbarui kata sandi untuk menjaga keamanan akun Anda</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Kata Sandi Saat Ini</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                required
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 pr-10 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#7b3fe4] focus:bg-white transition-all"
                placeholder="Masukkan kata sandi saat ini"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Kata Sandi Baru</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 pr-10 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#7b3fe4] focus:bg-white transition-all"
                  placeholder="Minimal 6 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Konfirmasi Kata Sandi Baru</label>
              <input
                type={showNewPassword ? "text" : "password"}
                required
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#7b3fe4] focus:bg-white transition-all"
                placeholder="Ulangi kata sandi baru"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={passwordLoading}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-5 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/10 transition-all cursor-pointer disabled:opacity-50"
            >
              <Key size={14} /> {passwordLoading ? 'Memproses...' : 'Perbarui Kata Sandi'}
            </button>
          </div>
        </form>
      </div>

      {/* ====== CUSTOM ALERT MODAL ====== */}
      {alertModal.show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 flex flex-col items-center text-center space-y-4 animate-scale-up">
            <div className={`p-3 rounded-full ${alertModal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
              {alertModal.type === 'success' ? (
                <Check size={28} />
              ) : (
                <AlertTriangle size={28} />
              )}
            </div>
            
            <div className="space-y-1.5 w-full">
              <h3 className="text-base font-extrabold text-gray-800">{alertModal.title}</h3>
              <p className="text-xs text-gray-400 font-semibold leading-relaxed px-2 whitespace-pre-line">{alertModal.message}</p>
            </div>
            
            <div className="w-full pt-2">
              <button
                type="button"
                onClick={() => setAlertModal(prev => ({ ...prev, show: false }))}
                className={`w-full text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition-colors cursor-pointer ${
                  alertModal.type === 'success' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10' 
                    : 'bg-red-600 hover:bg-red-700 shadow-red-500/10'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== CUSTOM CONFIRMATION MODAL ====== */}
      <ConfirmationModal
        isOpen={confirmModal.show}
        onClose={() => setConfirmModal(prev => ({ ...prev, show: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </div>
  );
};

export default Profile;
