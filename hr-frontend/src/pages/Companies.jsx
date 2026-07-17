import { apiFetch } from '../utils/api';
import React, { useState, useEffect } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ company_name: '', address: '', phone: '', email: '' });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'update',
    onConfirm: null
  });

  const fetchCompanies = () => {
    setLoading(true);
    apiFetch('/api/companies')
      .then(res => res.json())
      .then((data) => {
        if (data.status === "Success") setCompanies(data.data);
        setLoading(false);
      })
      .catch((error) => console.error("Error:", error));
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmModal({
      show: true,
      title: editingId ? 'Konfirmasi Edit Company' : 'Konfirmasi Tambah Company',
      message: editingId 
        ? `Apakah Anda yakin ingin menyimpan perubahan data perusahaan "${formData.company_name}"?`
        : `Apakah Anda yakin ingin menambahkan perusahaan baru "${formData.company_name}"?`,
      type: editingId ? 'update' : 'create',
      onConfirm: () => executeSubmit()
    });
  };

  const executeSubmit = () => {
    const url = editingId 
      ? `/api/companies/${editingId}` 
      : '/api/companies';
    const method = editingId ? 'PUT' : 'POST';

    apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    }).then(() => {
      setShowModal(false);
      setEditingId(null);
      fetchCompanies();
    });
  };

  const handleEdit = (company) => {
    setFormData({
      company_name: company.company_name,
      address: company.address || '',
      phone: company.phone || '',
      email: company.email || ''
    });
    setEditingId(company.id);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    const company = companies.find(c => c.id === id);
    const companyName = company ? company.company_name : '';
    setConfirmModal({
      show: true,
      title: 'Konfirmasi Hapus Company',
      message: `Apakah Anda yakin ingin menghapus perusahaan "${companyName}"?\nSemua job dan position terkait akan ikut terhapus secara permanen.`,
      type: 'delete',
      onConfirm: () => {
        apiFetch(`/api/companies/${id}`, { method: 'DELETE' })
          .then(() => fetchCompanies());
      }
    });
  };

  const openAddModal = () => {
    setFormData({ company_name: '', address: '', phone: '', email: '' });
    setEditingId(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-50 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Manajemen Company</h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">Kelola daftar unit perusahaan terdaftar</p>
        </div>
        <button onClick={openAddModal} className="bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] text-white font-bold text-xs py-2.5 px-5 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/10 hover:shadow-lg transition-all cursor-pointer">
          + Tambah Company
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] text-white text-xs font-bold tracking-wider uppercase">
                <th className="p-4 rounded-tl-2xl">ID</th>
                <th className="p-4">Nama Company</th>
                <th className="p-4">Alamat</th>
                <th className="p-4">Telepon</th>
                <th className="p-4">Email</th>
                <th className="p-4 rounded-tr-2xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-600">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-[#7b3fe4] font-bold">{company.id}</td>
                  <td className="p-4 font-bold text-gray-800">{company.company_name}</td>
                  <td className="p-4 text-gray-400 max-w-xs truncate">{company.address || '-'}</td>
                  <td className="p-4 text-gray-500">{company.phone || '-'}</td>
                  <td className="p-4 text-gray-500">{company.email || '-'}</td>
                  <td className="p-4 flex gap-3">
                    <button onClick={() => handleEdit(company)} className="text-[#7b3fe4] hover:text-[#3a6bf6] font-bold cursor-pointer">Edit</button>
                    <button onClick={() => handleDelete(company.id)} className="text-red-500 hover:text-red-700 font-bold cursor-pointer">Hapus</button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && !loading && (
                <tr><td colSpan="6" className="p-8 text-center text-gray-400">Belum ada data company.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{editingId ? "Edit Company" : "Tambah Company"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-gray-500">
              <div>
                <label className="block mb-1.5">Nama Company</label>
                <input type="text" placeholder="Nama perusahaan" required className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] transition-all bg-white text-gray-700" 
                  value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
              </div>
              <div>
                <label className="block mb-1.5">Alamat</label>
                <textarea placeholder="Alamat lengkap" className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] transition-all bg-white text-gray-700" rows="2"
                  value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div>
                <label className="block mb-1.5">Telepon</label>
                <input type="text" placeholder="Nomor telepon" className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] transition-all bg-white text-gray-700" 
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <label className="block mb-1.5">Email</label>
                <input type="email" placeholder="Email perusahaan" className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#7b3fe4] focus:border-[#7b3fe4] transition-all bg-white text-gray-700" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
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

export default Companies;
