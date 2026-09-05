import { apiFetch } from '../utils/api';
import React, { useState, useEffect } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '', company_id: '', role_id: '', position_id: '',
    full_name: '', email: '', hashed_password: '', status: 'Active'
  });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'update',
    onConfirm: null
  });

  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const currentRole = localStorage.getItem('role');
  const isAdmin = currentRole === 'Super Admin' || currentRole === 'Admin HR';

  const fetchUsers = () => {
    setLoading(true);
    apiFetch('/api/users')
      .then(res => res.json())
      .then((data) => {
        if (data.status === "Success") setUsers(data.data);
        setLoading(false);
      })
      .catch((error) => console.error("Error:", error));
  };

  const fetchDropdowns = () => {
    apiFetch('/api/roles').then(r => r.json()).then(d => { if (d.status === "Success") setRoles(d.data); });
    apiFetch('/api/companies').then(r => r.json()).then(d => { if (d.status === "Success") setCompanies(d.data); });
    apiFetch('/api/positions').then(r => r.json()).then(d => { if (d.status === "Success") setPositions(d.data); });
    apiFetch('/api/profile').then(r => r.json()).then(d => { if (d.status === "Success") setCurrentUserProfile(d.data); });
  };

  useEffect(() => { fetchUsers(); fetchDropdowns(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmModal({
      show: true,
      title: editingId ? 'Konfirmasi Edit Karyawan' : 'Konfirmasi Tambah Karyawan',
      message: editingId
        ? `Apakah Anda yakin ingin menyimpan perubahan data karyawan "${formData.full_name}"?`
        : `Apakah Anda yakin ingin menambahkan karyawan baru "${formData.full_name}"?`,
      type: editingId ? 'update' : 'create',
      onConfirm: () => executeSubmit()
    });
  };

  const executeSubmit = () => {
    const isEdit = !!editingId;
    const url = isEdit 
      ? `/api/users/${editingId}` 
      : '/api/users';
    const method = isEdit ? 'PUT' : 'POST';

    const payload = {
      ...formData,
      company_id: formData.company_id ? parseInt(formData.company_id) : null,
      role_id: formData.role_id ? parseInt(formData.role_id) : null,
      position_id: formData.position_id ? parseInt(formData.position_id) : null,
    };
    
    // Remove password from update payload
    if (editingId) {
      delete payload.hashed_password;
    }

    setIsSubmitting(true);
    apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(() => {
      setShowModal(false);
      setEditingId(null);
      fetchUsers();
      setConfirmModal({
        show: true,
        title: 'Sukses',
        message: isEdit ? 'Data karyawan berhasil diperbarui.' : 'Data karyawan berhasil ditambahkan.',
        type: 'success'
      });
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setIsSubmitting(false);
    });
  };

  const handleEdit = (user) => {
    setFormData({
      employee_id: user.employee_id || '',
      company_id: user.company_id || '',
      role_id: user.role_id || '',
      position_id: user.position_id || '',
      full_name: user.full_name,
      email: user.email,
      hashed_password: '',
      status: user.status,
      joined_date: user.joined_date ? user.joined_date.split('T')[0] : (user.created_at ? user.created_at.split('T')[0] : '')
    });
    setEditingId(user.id);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    const user = users.find(u => u.id === id);
    const userName = user ? user.full_name : '';
    setConfirmModal({
      show: true,
      title: 'Konfirmasi Hapus Karyawan',
      message: `Apakah Anda yakin ingin menghapus karyawan "${userName}"?`,
      type: 'delete',
      onConfirm: () => {
        apiFetch(`/api/users/${id}`, { method: 'DELETE' })
          .then(() => {
            fetchUsers();
            setConfirmModal({
              show: true,
              title: 'Sukses',
              message: `Data karyawan "${userName}" berhasil dihapus.`,
              type: 'success'
            });
          });
      }
    });
  };

  const openAddModal = () => {
    const defaultCompanyId = currentRole === 'Admin HR' && currentUserProfile?.company_id 
      ? currentUserProfile.company_id.toString() 
      : '';

    const karyawanRole = roles.find(r => r.role_name === 'Karyawan');
    const defaultRoleId = currentRole === 'Admin HR' && karyawanRole 
      ? karyawanRole.id.toString() 
      : (roles.find(r => r.role_name !== 'Super Admin')?.id.toString() || '');

    setFormData({
      employee_id: '',
      company_id: defaultCompanyId,
      role_id: defaultRoleId,
      position_id: '',
      full_name: '',
      email: '',
      hashed_password: '',
      status: 'Active',
      joined_date: new Date().toISOString().split('T')[0]
    });
    setEditingId(null);
    setShowModal(true);
  };

  // Exclude Super Admin role from form selection
  const selectableRoles = roles.filter(r => r.role_name !== 'Super Admin');

  // Filter positions by selected company
  const activeCompanyId = currentRole === 'Admin HR' && currentUserProfile?.company_id
    ? currentUserProfile.company_id
    : (formData.company_id ? parseInt(formData.company_id) : null);

  const filteredPositions = activeCompanyId
    ? positions.filter(p => p.company_id === activeCompanyId)
    : positions;

  const filteredUsers = users.filter((u) => {
    if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.employee_id || '').toLowerCase().includes(q) ||
      (u.position_name || '').toLowerCase().includes(q) ||
      (u.role_name || '').toLowerCase().includes(q) ||
      (u.company_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-50 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
            {isAdmin ? 'Manajemen User' : 'Direktori Rekan Kerja'}
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">
            {isAdmin ? 'Kelola pengguna dan penugasan jabatan karyawan' : 'Daftar seluruh rekan kerja & kontak tim'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              placeholder={isAdmin ? "Cari nama, ID, jabatan..." : "Cari rekan kerja..."}
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-7 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 text-gray-700 transition-all placeholder:text-gray-400"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
          {isAdmin && (
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 text-gray-700 font-semibold cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="Active">Aktif</option>
              <option value="Inactive">Nonaktif</option>
            </select>
          )}
          {isAdmin && (
            <button onClick={openAddModal} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-orange-500/20 hover:shadow-lg transition-all cursor-pointer whitespace-nowrap">
              + Tambah User
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold tracking-wider uppercase">
                <th className="p-4 rounded-tl-2xl">ID Karyawan</th>
                <th className="p-4">Nama Lengkap</th>
                <th className="p-4">Email</th>
                <th className="p-4">Peran (Role)</th>
                <th className="p-4">Perusahaan</th>
                <th className="p-4">Jabatan</th>
                <th className="p-4">Status</th>
                <th className="p-4 rounded-tr-2xl">{isAdmin ? 'Aksi' : 'Kontak'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-600">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-orange-600 font-bold">{user.employee_id || `EMP-${user.id}`}</td>
                  <td className="p-4 font-bold text-gray-800">{user.full_name}</td>
                  <td className="p-4 text-gray-500">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full ${
                      user.role_name === 'Super Admin' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                      user.role_name === 'Admin HR' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {user.role_name || '-'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{user.company_name || '-'}</td>
                  <td className="p-4 text-gray-500">{user.position_name || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {user.status === 'Active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-3 items-center">
                    {(user.id === currentUserProfile?.id || user.email === currentUserProfile?.email) ? (
                      <span className="text-orange-600 font-bold bg-orange-50 px-2.5 py-1 rounded-md text-[10px] border border-orange-100">
                        👤 Akun Anda
                      </span>
                    ) : isAdmin ? (
                      <>
                        <button onClick={() => handleEdit(user)} className="text-orange-600 hover:text-orange-700 active:scale-95 font-bold cursor-pointer transition-transform">Edit</button>
                        <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700 active:scale-95 font-bold cursor-pointer transition-transform">Hapus</button>
                      </>
                    ) : (
                      <a href={`mailto:${user.email}`} className="text-orange-600 hover:text-orange-700 font-bold text-xs bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-md transition-colors active:scale-95">
                        ✉ Hubungi
                      </a>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-400">
                    <p className="font-semibold text-sm">
                      {searchFilter || statusFilter !== 'ALL' 
                        ? 'Tidak ada karyawan yang cocok dengan filter pencarian.' 
                        : 'Belum ada data user.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100 animate-slide-up">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{editingId ? "Edit User" : "Tambah User"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-gray-500">
              <div>
                <label className="block mb-1.5">ID Karyawan</label>
                <input type="text" placeholder="Contoh: EMP-001" className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white text-gray-700" 
                  value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})} />
              </div>
              <div>
                <label className="block mb-1.5">Nama Lengkap</label>
                <input type="text" placeholder="Nama lengkap" required className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white text-gray-700" 
                  value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
              </div>
              <div>
                <label className="block mb-1.5">Email</label>
                <input type="email" placeholder="Email" required className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white text-gray-700" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              {!editingId && (
                <div>
                  <label className="block mb-1.5">Password</label>
                  <input type="password" placeholder="Password" required className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white text-gray-700" 
                    value={formData.hashed_password} onChange={e => setFormData({...formData, hashed_password: e.target.value})} />
                </div>
              )}
              <div>
                <label className="block mb-1.5">Peran (Role)</label>
                {currentRole === 'Admin HR' ? (
                  <input type="text" readOnly disabled value="Karyawan" className="w-full px-3 py-2 border rounded-xl bg-gray-100 text-gray-500 font-bold cursor-not-allowed" />
                ) : (
                  <select className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white text-gray-700" 
                    value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})}>
                    <option value="">-- Pilih Peran --</option>
                    {selectableRoles.map(r => <option key={r.id} value={r.id}>{r.role_name}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="block mb-1.5">Perusahaan</label>
                {currentRole === 'Admin HR' ? (
                  <input type="text" readOnly disabled value={currentUserProfile?.company_name || 'Perusahaan Admin HR'} className="w-full px-3 py-2 border rounded-xl bg-gray-100 text-gray-500 font-bold cursor-not-allowed" />
                ) : (
                  <select className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white text-gray-700" 
                    value={formData.company_id} 
                    onChange={e => {
                      const newCompanyId = e.target.value;
                      let newPositionId = formData.position_id;
                      if (newCompanyId && formData.position_id) {
                        const selectedPos = positions.find(p => p.id === parseInt(formData.position_id));
                        if (selectedPos && selectedPos.company_id !== parseInt(newCompanyId)) {
                          newPositionId = '';
                        }
                      }
                      setFormData({...formData, company_id: newCompanyId, position_id: newPositionId});
                    }}>
                    <option value="">-- Pilih Perusahaan --</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="block mb-1.5">Jabatan</label>
                <select className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white text-gray-700" 
                  value={formData.position_id} onChange={e => setFormData({...formData, position_id: e.target.value})}>
                  <option value="">-- Pilih Jabatan --</option>
                  {filteredPositions.map(p => <option key={p.id} value={p.id}>{p.position_name} ({p.job_name})</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1.5">Tanggal Bergabung</label>
                <input type="date" className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white text-gray-700" 
                  value={formData.joined_date} onChange={e => setFormData({...formData, joined_date: e.target.value})} />
              </div>
              <div>
                <label className="block mb-1.5">Status</label>
                <select className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white text-gray-700" 
                  value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="Active">Aktif</option>
                  <option value="Inactive">Nonaktif</option>
                </select>
              </div>
              <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gray-50">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2.5 bg-red-50/80 hover:bg-red-100 active:scale-95 text-red-600 border border-red-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 cursor-pointer transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default Users;
