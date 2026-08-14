import { apiFetch } from '../utils/api';
import React, { useState, useEffect } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ job_id: '', position_name: '', description: '' });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'update',
    onConfirm: null
  });

  const fetchPositions = () => {
    setLoading(true);
    apiFetch('/api/positions')
      .then(res => res.json())
      .then((data) => {
        if (data.status === "Success") setPositions(data.data);
        setLoading(false);
      })
      .catch((error) => console.error("Error:", error));
  };

  const fetchJobs = () => {
    apiFetch('/api/jobs')
      .then(res => res.json())
      .then((data) => {
        if (data.status === "Success") setJobs(data.data);
      });
  };

  useEffect(() => { fetchPositions(); fetchJobs(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmModal({
      show: true,
      title: editingId ? 'Konfirmasi Edit Jabatan' : 'Konfirmasi Tambah Jabatan',
      message: editingId
        ? `Apakah Anda yakin ingin menyimpan perubahan data jabatan "${formData.position_name}"?`
        : `Apakah Anda yakin ingin menambahkan jabatan baru "${formData.position_name}"?`,
      type: editingId ? 'update' : 'create',
      onConfirm: () => executeSubmit()
    });
  };

  const executeSubmit = () => {
    const isEdit = !!editingId;
    const url = isEdit 
      ? `/api/positions/${editingId}` 
      : '/api/positions';
    const method = isEdit ? 'PUT' : 'POST';

    const payload = { ...formData, job_id: parseInt(formData.job_id) };
    apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(() => {
      setShowModal(false);
      setEditingId(null);
      fetchPositions();
      setConfirmModal({
        show: true,
        title: 'Sukses',
        message: isEdit ? 'Data jabatan berhasil diperbarui.' : 'Data jabatan berhasil ditambahkan.',
        type: 'success'
      });
    });
  };

  const handleEdit = (position) => {
    setFormData({
      job_id: position.job_id || '',
      position_name: position.position_name,
      description: position.description || ''
    });
    setEditingId(position.id);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    const pos = positions.find(p => p.id === id);
    const posName = pos ? pos.position_name : '';
    setConfirmModal({
      show: true,
      title: 'Konfirmasi Hapus Jabatan',
      message: `Apakah Anda yakin ingin menghapus jabatan "${posName}"?`,
      type: 'delete',
      onConfirm: () => {
        apiFetch(`/api/positions/${id}`, { method: 'DELETE' })
          .then(() => {
            fetchPositions();
            setConfirmModal({
              show: true,
              title: 'Sukses',
              message: `Data jabatan "${posName}" berhasil dihapus.`,
              type: 'success'
            });
          });
      }
    });
  };

  const openAddModal = () => {
    setFormData({ job_id: '', position_name: '', description: '' });
    setEditingId(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-50 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Manajemen Jabatan (Position)</h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">Kelola jabatan atau spesialisasi peran karyawan</p>
        </div>
        <button onClick={openAddModal} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl flex items-center gap-1.5 shadow-md shadow-orange-500/20 hover:shadow-lg transition-all cursor-pointer">
          + Tambah Jabatan
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold tracking-wider uppercase">
                <th className="p-4 rounded-tl-2xl">ID</th>
                <th className="p-4">Nama Jabatan</th>
                <th className="p-4">Divisi</th>
                <th className="p-4">Perusahaan</th>
                <th className="p-4">Deskripsi</th>
                <th className="p-4 rounded-tr-2xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-600">
              {positions.map((pos) => (
                <tr key={pos.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-orange-600 font-bold">{pos.id}</td>
                  <td className="p-4 font-bold text-gray-800">{pos.position_name}</td>
                  <td className="p-4 text-gray-500">{pos.job_name || '-'}</td>
                  <td className="p-4 text-gray-500">{pos.company_name || '-'}</td>
                  <td className="p-4 text-gray-400 max-w-xs truncate">{pos.description || '-'}</td>
                  <td className="p-4 flex gap-3">
                    <button onClick={() => handleEdit(pos)} className="text-orange-600 hover:text-orange-700 font-bold cursor-pointer">Edit</button>
                    <button onClick={() => handleDelete(pos.id)} className="text-red-500 hover:text-red-700 font-bold cursor-pointer">Hapus</button>
                  </td>
                </tr>
              ))}
              {positions.length === 0 && !loading && (
                <tr><td colSpan="6" className="p-8 text-center text-gray-400">Belum ada data jabatan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100 animate-slide-up">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{editingId ? "Edit Jabatan" : "Tambah Jabatan"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-gray-500">
              <div>
                <label className="block mb-1.5">Divisi</label>
                <select required className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white text-gray-700" 
                  value={formData.job_id} onChange={e => setFormData({...formData, job_id: e.target.value})}>
                  <option value="">-- Pilih Divisi --</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.job_name} ({j.company_name})</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1.5">Nama Jabatan</label>
                <input type="text" placeholder="Contoh: Junior Developer" required className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white text-gray-700" 
                  value={formData.position_name} onChange={e => setFormData({...formData, position_name: e.target.value})} />
              </div>
              <div>
                <label className="block mb-1.5">Deskripsi</label>
                <textarea placeholder="Deskripsi position" className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white text-gray-700" rows="3"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gray-50">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2.5 bg-red-50/80 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 cursor-pointer transition-all"
                >
                  Simpan
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

export default Positions;
