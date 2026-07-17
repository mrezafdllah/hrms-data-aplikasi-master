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
    company_id: '', role_id: '', position_id: '',
    full_name: '', email: '', hashed_password: '', status: 'Active'
  });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'update',
    onConfirm: null
  });

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
    const url = editingId 
      ? `/api/users/${editingId}` 
      : '/api/users';
    const method = editingId ? 'PUT' : 'POST';

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

    apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(() => {
      setShowModal(false);
      setEditingId(null);
      fetchUsers();
    });
  };

  const handleEdit = (user) => {
    setFormData({
      company_id: user.company_id || '',
      role_id: user.role_id || '',
      position_id: user.position_id || '',
      full_name: user.full_name,
      email: user.email,
      hashed_password: '',
      status: user.status
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
          .then(() => fetchUsers());
      }
    });
  };

  const openAddModal = () => {
    setFormData({
      company_id: '', role_id: '', position_id: '',
      full_name: '', email: '', hashed_password: '', status: 'Active'
    });
    setEditingId(null);
    setShowModal(true);
  };

  const filteredPositions = formData.company_id
    ? positions.filter(p => p.company_id === parseInt(formData.company_id))
    : positions;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-50 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Manajemen User</h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">Kelola pengguna dan penugasan jabatan karyawan</p>
        </div>
        <button onClick={openAddModal} className="bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] text-white font-bold text-xs py-2.5 px-5 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/10 hover:shadow-lg transition-all cursor-pointer">
          + Tambah User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] text-white text-xs font-bold tracking-wider uppercase">
                <th className="p-4 rounded-tl-2xl">ID</th>
                <th className="p-4">Nama Lengkap</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Company</th>
                <th className="p-4">Position</th>
                <th className="p-4">Status</th>
                <th className="p-4 rounded-tr-2xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-600">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-[#7b3fe4] font-bold">{user.id}</td>
                  <td className="p-4 font-bold text-gray-800">{user.full_name}</td>
                  <td className="p-4 text-gray-500">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full ${
                      user.role_name === 'Super Admin' ? 'bg-purple-50 text-[#7b3fe4]' : 
                      user.role_name === 'Admin HR' ? 'bg-blue-50 text-[#3a6bf6]' : 
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {user.role_name || '-'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{user.company_name || '-'}</td>
                  <td className="p-4 text-gray-500">{user.position_name || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 flex gap-3">
                    <button onClick={() => handleEdit(user)} className="text-[#7b3fe4] hover:text-[#3a6bf6] font-bold cursor-pointer">Edit</button>
                    <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700 font-bold cursor-pointer">Hapus</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr><td colSpan="8" className="p-8 text-center text-gray-400">Belum ada data user.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{editingId ? "Edit User" : "Tambah User"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-gray-500">
              <div>
                <label className="block mb-1.5">Nama Lengkap</label>
                <input type="text" placeholder="Nama lengkap" required className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] transition-all bg-white text-gray-700" 
                  value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
              </div>
              <div>
                <label className="block mb-1.5">Email</label>
                <input type="email" placeholder="Email" required className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] transition-all bg-white text-gray-700" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              {!editingId && (
                <div>
                  <label className="block mb-1.5">Password</label>
                  <input type="password" placeholder="Password" required className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] transition-all bg-white text-gray-700" 
                    value={formData.hashed_password} onChange={e => setFormData({...formData, hashed_password: e.target.value})} />
                </div>
              )}
              <div>
                <label className="block mb-1.5">Role</label>
                <select className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] transition-all bg-white text-gray-700" 
                  value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})}>
                  <option value="">-- Pilih Role --</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.role_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1.5">Company</label>
                <select className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] transition-all bg-white text-gray-700" 
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
                  <option value="">-- Pilih Company --</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1.5">Position</label>
                <select className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] transition-all bg-white text-gray-700" 
                  value={formData.position_id} onChange={e => setFormData({...formData, position_id: e.target.value})}>
                  <option value="">-- Pilih Position --</option>
                  {filteredPositions.map(p => <option key={p.id} value={p.id}>{p.position_name} ({p.job_name})</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1.5">Status</label>
                <select className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] transition-all bg-white text-gray-700" 
                  value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-50">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl cursor-pointer">Batal</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] text-white rounded-xl shadow-md shadow-blue-500/10 cursor-pointer">Simpan</button>
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
