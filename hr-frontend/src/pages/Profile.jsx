import { apiFetch, API_BASE_URL } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { UserCircle, Camera, Check, X, Edit3 } from 'lucide-react';

const translations = {
  ID: {
    title: "Profil Saya",
    subtitle: "Informasi akun dan data pribadi Anda",
    editProfile: "Edit Profil",
    cancel: "Batal",
    saveChanges: "Simpan Perubahan",
    successMsg: "Profil berhasil diperbarui!",
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
    uploadSuccess: "Foto profil berhasil diperbarui!",
    uploadFailed: "Gagal mengunggah foto profil.",
    choosePosition: "Pilih Jabatan (Khusus Admin)",
    changePhoto: "Ganti Foto",
    uploading: "Mengunggah...",
    placeholderAddress: "Masukkan alamat lengkap rumah Anda",
    placeholderBirthPlace: "Contoh: Jakarta",
    loadingMsg: "Memuat Profil...",
    notFoundMsg: "Data profil tidak ditemukan.",
  },
  EN: {
    title: "My Profile",
    subtitle: "Your account details and personal data",
    editProfile: "Edit Profile",
    cancel: "Cancel",
    saveChanges: "Save Changes",
    successMsg: "Profile successfully updated!",
    accountPositionInfo: "Account & Position Information",
    fullName: "Full Name",
    email: "Email Address",
    birthPlace: "Place of Birth",
    birthDate: "Date of Birth",
    address: "Home Address",
    company: "Company",
    job: "Job Name",
    position: "Position Title",
    joinedSince: "Member Since",
    uploadSuccess: "Profile picture successfully updated!",
    uploadFailed: "Failed to upload profile picture.",
    choosePosition: "Select Position (Admin Only)",
    changePhoto: "Change Photo",
    uploading: "Uploading...",
    placeholderAddress: "Enter your full home address",
    placeholderBirthPlace: "Example: Jakarta",
    loadingMsg: "Loading Profile...",
    notFoundMsg: "Profile data not found.",
  }
};

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'ID');
  
  useEffect(() => {
    const handleLangChange = () => {
      setLanguage(localStorage.getItem('language') || 'ID');
    };
    window.addEventListener('languageChange', handleLangChange);
    return () => {
      window.removeEventListener('languageChange', handleLangChange);
    };
  }, []);

  const t = translations[language] || translations.ID;

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    birth_place: '',
    birth_date: '',
    address: '',
    profile_picture: '',
    position_id: ''
  });

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
            full_name: data.data.full_name || '',
            email: data.data.email || '',
            birth_place: data.data.birth_place || '',
            birth_date: data.data.birth_date ? data.data.birth_date.split('T')[0] : '',
            address: data.data.address || '',
            profile_picture: data.data.profile_picture || '',
            position_id: data.data.position_id || ''
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
          alert(t.uploadFailed);
        }
      })
      .catch(err => {
        setUploading(false);
        console.error(err);
        alert(t.uploadFailed);
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
    
    const payload = { ...formData };
    if (!isAdmin) {
      delete payload.position_id;
    }

    apiFetch('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then((data) => {
        if (data.status === "Success") {
          setMessage(t.successMsg);
          setIsEditing(false);
          fetchProfile();
          setTimeout(() => setMessage(''), 3000);
        } else {
          alert('Gagal memperbarui profil: ' + data.detail);
        }
      })
      .catch(err => {
        console.error(err);
        alert('Terjadi kesalahan saat menyimpan');
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
                accept="image/*" 
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
                {profile.status === 'Active' ? (language === 'ID' ? 'Aktif' : 'Active') : (language === 'ID' ? 'Nonaktif' : 'Inactive')}
              </span>
              <span className="px-2.5 py-0.5 text-[9px] font-bold rounded-full bg-purple-50 text-[#7b3fe4]">
                {profile.role_name || (language === 'ID' ? 'Karyawan' : 'Employee')}
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
                      position_id: profile.position_id || ''
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
                  {profile.birth_date ? `, ${new Date(profile.birth_date).toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.address}</label>
                <p className="text-gray-800 font-bold mt-1 text-sm leading-relaxed">{profile.address || '-'}</p>
              </div>
              <div className="md:col-span-2 pt-3 border-t border-gray-50">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.joinedSince}</label>
                <p className="text-gray-800 font-bold mt-1 text-sm">
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
