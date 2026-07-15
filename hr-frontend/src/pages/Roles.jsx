import { apiFetch } from '../utils/api';
import React, { useState, useEffect } from 'react';

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ role_name: '', description: '' });

  const fetchRoles = () => {
    setLoading(true);
    apiFetch('http://localhost:8000/api/roles')
      .then(res => res.json())
      .then((data) => {
        if (data.status === "Success") setRoles(data.data);
        setLoading(false);
      })
      .catch((error) => console.error("Error:", error));
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = editingId 
      ? `http://localhost:8000/api/roles/${editingId}` 
      : 'http://localhost:8000/api/roles';
    const method = editingId ? 'PUT' : 'POST';

    apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    }).then(() => {
      setShowModal(false);
      setEditingId(null);
      fetchRoles();
    });
  };

  const handleEdit = (role) => {
    setFormData({ role_name: role.role_name, description: role.description || '' });
    setEditingId(role.id);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Hapus role ini?")) {
      apiFetch(`http://localhost:8000/api/roles/${id}`, { method: 'DELETE' })
        .then(() => fetchRoles());
    }
  };

  const openAddModal = () => {
    setFormData({ role_name: '', description: '' });
    setEditingId(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-50 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Manajemen Role</h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">Kelola tingkat hak akses pengguna</p>
        </div>
        <button onClick={openAddModal} className="bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] text-white font-bold text-xs py-2.5 px-5 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/10 hover:shadow-lg transition-all cursor-pointer">
          + Tambah Role
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] text-white text-xs font-bold tracking-wider uppercase">
                <th className="p-4 rounded-tl-2xl">ID</th>
                <th className="p-4">Nama Role</th>
                <th className="p-4">Deskripsi</th>
                <th className="p-4 rounded-tr-2xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-600">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-[#7b3fe4] font-bold">{role.id}</td>
                  <td className="p-4 font-bold text-gray-800">{role.role_name}</td>
                  <td className="p-4 text-gray-500">{role.description || '-'}</td>
                  <td className="p-4 flex gap-3">
                    <button onClick={() => handleEdit(role)} className="text-[#7b3fe4] hover:text-[#3a6bf6] font-bold cursor-pointer">Edit</button>
                    <button onClick={() => handleDelete(role.id)} className="text-red-500 hover:text-red-700 font-bold cursor-pointer">Hapus</button>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && !loading && (
                <tr><td colSpan="4" className="p-8 text-center text-gray-400">Belum ada data role.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{editingId ? "Edit Role" : "Tambah Role"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-gray-500">
              <div>
                <label className="block mb-1.5">Nama Role</label>
                <input type="text" placeholder="Contoh: Admin, Manager" required className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] transition-all bg-white text-gray-700" 
                  value={formData.role_name} onChange={e => setFormData({...formData, role_name: e.target.value})} />
              </div>
              <div>
                <label className="block mb-1.5">Deskripsi</label>
                <textarea placeholder="Deskripsi role" className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] transition-all bg-white text-gray-700" rows="3"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-50">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl cursor-pointer">Batal</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] text-white rounded-xl shadow-md shadow-blue-500/10 cursor-pointer">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
