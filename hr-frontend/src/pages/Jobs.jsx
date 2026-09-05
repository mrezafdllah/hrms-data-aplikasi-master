import { apiFetch } from '../utils/api';
import React, { useState, useEffect } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ company_id: '', job_name: '', description: '' });
  const currentRole = localStorage.getItem('role');
  const isAdmin = currentRole === 'Super Admin' || currentRole === 'Admin HR';
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
      title: editingId ? 'Konfirmasi Edit Divisi' : 'Konfirmasi Tambah Divisi',
      message: editingId
        ? `Apakah Anda yakin ingin menyimpan perubahan data divisi "${formData.job_name}"?`
        : `Apakah Anda yakin ingin menambahkan divisi baru "${formData.job_name}"?`,
      type: editingId ? 'update' : 'create',
      onConfirm: () => executeSubmit()
    });
  };

  const executeSubmit = () => {
    const isEdit = !!editingId;
    const url = isEdit 
      ? `/api/jobs/${editingId}` 
      : '/api/jobs';
    const method = isEdit ? 'PUT' : 'POST';

    const payload = { ...formData, company_id: parseInt(formData.company_id) };
    setIsSubmitting(true);
    apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(() => {
      setShowModal(false);
      setEditingId(null);
      fetchJobs();
      setConfirmModal({
        show: true,
        title: 'Sukses',
        message: isEdit ? 'Data divisi berhasil diperbarui.' : 'Data divisi berhasil ditambahkan.',
        type: 'success'
      });
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setIsSubmitting(false);
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
      title: 'Konfirmasi Hapus Divisi',
      message: `Apakah Anda yakin ingin menghapus divisi "${jobName}"?\nSemua jabatan (position) terkait akan ikut terhapus secara permanen.`,
      type: 'delete',
      onConfirm: () => {
        apiFetch(`/api/jobs/${id}`, { method: 'DELETE' })
          .then(() => {
            fetchJobs();
            setConfirmModal({
              show: true,
              title: 'Sukses',
              message: `Data divisi "${jobName}" berhasil dihapus.`,
              type: 'success'
            });
          });
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
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Manajemen Divisi</h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">Kelola divisi atau unit kerja perusahaan</p>
        </div>
        {isAdmin && (
          <button onClick={openAddModal} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-bold text-xs py-2.5 px-5 rounded-xl flex items-center gap-1.5 shadow-md shadow-orange-500/20 hover:shadow-lg transition-all cursor-pointer">
            + Tambah Divisi
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold tracking-wider uppercase">
                <th className="p-4 rounded-tl-2xl">ID</th>
                <th className="p-4">Nama Divisi</th>
                <th className="p-4">Perusahaan</th>
                <th className="p-4">Deskripsi</th>
                <th className="p-4 rounded-tr-2xl">{isAdmin ? 'Aksi' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-600">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-orange-600 font-bold">{job.id}</td>
                  <td className="p-4 font-bold text-gray-800">{job.job_name}</td>
                  <td className="p-4 text-gray-500">{job.company_name || '-'}</td>
                  <td className="p-4 text-gray-400 max-w-xs truncate">{job.description || '-'}</td>
                  <td className="p-4 flex gap-3">
                    {isAdmin ? (
                      <>
                        <button onClick={() => handleEdit(job)} className="text-orange-600 hover:text-orange-700 active:scale-95 font-bold cursor-pointer transition-transform">Edit</button>
                        <button onClick={() => handleDelete(job.id)} className="text-red-500 hover:text-red-700 active:scale-95 font-bold cursor-pointer transition-transform">Hapus</button>
                      </>
                    ) : (
                      <span className="text-gray-400 font-normal italic text-[11px]">Hanya Baca</span>
                    )}
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && !loading && (
                <tr><td colSpan="5" className="p-8 text-center text-gray-400">Belum ada data divisi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100 animate-slide-up">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{editingId ? "Edit Divisi" : "Tambah Divisi"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-gray-500">
              <div>
                <label className="block mb-1.5">Perusahaan</label>
                <select required className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white text-gray-700" 
                  value={formData.company_id} onChange={e => setFormData({...formData, company_id: e.target.value})}>
                  <option value="">-- Pilih Perusahaan --</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1.5">Nama Divisi</label>
                <input type="text" placeholder="Contoh: Engineering" required className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white text-gray-700" 
                  value={formData.job_name} onChange={e => setFormData({...formData, job_name: e.target.value})} />
              </div>
              <div>
                <label className="block mb-1.5">Deskripsi</label>
                <textarea placeholder="Deskripsi job" className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white text-gray-700" rows="3"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
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

export default Jobs;
