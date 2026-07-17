import { apiFetch } from '../utils/api';
import React, { useState, useEffect } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ company_id: '', job_name: '', description: '' });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'update',
    onConfirm: null
  });

  const fetchJobs = () => {
    setLoading(true);
    apiFetch('/api/jobs')
      .then(res => res.json())
      .then((data) => {
        if (data.status === "Success") setJobs(data.data);
        setLoading(false);
      })
      .catch((error) => console.error("Error:", error));
  };

  const fetchCompanies = () => {
    apiFetch('/api/companies')
      .then(res => res.json())
      .then((data) => {
        if (data.status === "Success") setCompanies(data.data);
      });
  };

  useEffect(() => { fetchJobs(); fetchCompanies(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmModal({
      show: true,
      title: editingId ? 'Konfirmasi Edit Job' : 'Konfirmasi Tambah Job',
      message: editingId
        ? `Apakah Anda yakin ingin menyimpan perubahan data job "${formData.job_name}"?`
        : `Apakah Anda yakin ingin menambahkan job baru "${formData.job_name}"?`,
      type: editingId ? 'update' : 'create',
      onConfirm: () => executeSubmit()
    });
  };

  const executeSubmit = () => {
    const url = editingId 
      ? `/api/jobs/${editingId}` 
      : '/api/jobs';
    const method = editingId ? 'PUT' : 'POST';

    const payload = { ...formData, company_id: parseInt(formData.company_id) };
    apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(() => {
      setShowModal(false);
      setEditingId(null);
      fetchJobs();
    });
  };

  const handleEdit = (job) => {
    setFormData({
      company_id: job.company_id || '',
      job_name: job.job_name,
      description: job.description || ''
    });
    setEditingId(job.id);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    const job = jobs.find(j => j.id === id);
    const jobName = job ? job.job_name : '';
    setConfirmModal({
      show: true,
      title: 'Konfirmasi Hapus Job',
      message: `Apakah Anda yakin ingin menghapus job "${jobName}"?\nSemua position terkait akan ikut terhapus secara permanen.`,
      type: 'delete',
      onConfirm: () => {
        apiFetch(`/api/jobs/${id}`, { method: 'DELETE' })
          .then(() => fetchJobs());
      }
    });
  };

  const openAddModal = () => {
    setFormData({ company_id: '', job_name: '', description: '' });
    setEditingId(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-50 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Manajemen Job</h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">Kelola divisi atau kategori pekerjaan</p>
        </div>
        <button onClick={openAddModal} className="bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] text-white font-bold text-xs py-2.5 px-5 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/10 hover:shadow-lg transition-all cursor-pointer">
          + Tambah Job
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] text-white text-xs font-bold tracking-wider uppercase">
                <th className="p-4 rounded-tl-2xl">ID</th>
                <th className="p-4">Nama Job</th>
                <th className="p-4">Company</th>
                <th className="p-4">Deskripsi</th>
                <th className="p-4 rounded-tr-2xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-600">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-[#7b3fe4] font-bold">{job.id}</td>
                  <td className="p-4 font-bold text-gray-800">{job.job_name}</td>
                  <td className="p-4 text-gray-500">{job.company_name || '-'}</td>
                  <td className="p-4 text-gray-400 max-w-xs truncate">{job.description || '-'}</td>
                  <td className="p-4 flex gap-3">
                    <button onClick={() => handleEdit(job)} className="text-[#7b3fe4] hover:text-[#3a6bf6] font-bold cursor-pointer">Edit</button>
                    <button onClick={() => handleDelete(job.id)} className="text-red-500 hover:text-red-700 font-bold cursor-pointer">Hapus</button>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && !loading && (
                <tr><td colSpan="5" className="p-8 text-center text-gray-400">Belum ada data job.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{editingId ? "Edit Job" : "Tambah Job"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-gray-500">
              <div>
                <label className="block mb-1.5">Company</label>
                <select required className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] transition-all bg-white text-gray-700" 
                  value={formData.company_id} onChange={e => setFormData({...formData, company_id: e.target.value})}>
                  <option value="">-- Pilih Company --</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1.5">Nama Job</label>
                <input type="text" placeholder="Contoh: Software Engineer" required className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] transition-all bg-white text-gray-700" 
                  value={formData.job_name} onChange={e => setFormData({...formData, job_name: e.target.value})} />
              </div>
              <div>
                <label className="block mb-1.5">Deskripsi</label>
                <textarea placeholder="Deskripsi job" className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] transition-all bg-white text-gray-700" rows="3"
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

export default Jobs;
