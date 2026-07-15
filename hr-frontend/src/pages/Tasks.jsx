import { apiFetch } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Clock, AlertCircle, Plus, Edit2, Trash2, Calendar, ClipboardList } from 'lucide-react';

const COLORS = {
  'Pending': '#fbbf24',
  'In Progress': '#3b82f6',
  'Completed': '#10b981'
};

const translations = {
  ID: {
    title: "Tugas Harian",
    subtitleKaryawan: "Daftar tugas yang harus Anda kerjakan hari ini",
    subtitleAdmin: "Kelola tugas dan penugasan kerja karyawan",
    addTask: "Tambah Tugas",
    summary: "Ringkasan Tugas",
    pending: "Tertunda",
    inProgress: "Sedang Berjalan",
    completed: "Selesai",
    visualTitle: "Visualisasi Progress Tugas",
    visualEmpty: "Belum ada tugas untuk divisualisasikan.",
    listTitle: "Daftar Tugas",
    total: "Total",
    noTasks: "Belum ada tugas yang diberikan.",
    employee: "Karyawan",
    taskName: "Nama Tugas",
    description: "Deskripsi",
    date: "Tanggal",
    status: "Status",
    actions: "Aksi",
    modalAdd: "Tambah Tugas Baru",
    modalEdit: "Edit Tugas Kerja",
    assignedEmployee: "Karyawan Yang Ditugaskan",
    cancel: "Batal",
    save: "Simpan",
    placeholderDesc: "Tuliskan deskripsi tugas...",
    placeholderName: "Masukkan nama tugas",
    onlyEmployee: "Hanya Karyawan",
    edit: "Edit",
    delete: "Hapus",
    chooseEmployee: "Pilih Karyawan",
  },
  EN: {
    title: "Daily Tasks",
    subtitleKaryawan: "List of tasks you need to complete today",
    subtitleAdmin: "Manage employee tasks and work assignments",
    addTask: "Add Task",
    summary: "Task Summary",
    pending: "Pending",
    inProgress: "In Progress",
    completed: "Completed",
    visualTitle: "Task Progress Visualization",
    visualEmpty: "No tasks to visualize.",
    listTitle: "Task List",
    total: "Total",
    noTasks: "No tasks assigned yet.",
    employee: "Employee",
    taskName: "Task Name",
    description: "Description",
    date: "Date",
    status: "Status",
    actions: "Actions",
    modalAdd: "Add New Task",
    modalEdit: "Edit Task Assignment",
    assignedEmployee: "Assigned Employee",
    cancel: "Cancel",
    save: "Save",
    placeholderDesc: "Write task description...",
    placeholderName: "Enter task name",
    onlyEmployee: "Karyawan Only",
    edit: "Edit",
    delete: "Delete",
    chooseEmployee: "Choose Employee",
  }
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });
  
  const role = localStorage.getItem('role');
  const isKaryawan = role === 'Karyawan';
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
    user_id: '',
    task_name: '',
    description: '',
    task_date: new Date().toISOString().split('T')[0],
    status: 'Pending'
  });

  const fetchTasks = () => {
    setLoading(true);
    apiFetch('http://localhost:8000/api/tasks')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'Success') setTasks(data.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching tasks:", error);
        setLoading(false);
      });
  };

  const fetchUsers = () => {
    if (!isKaryawan) {
      apiFetch('http://localhost:8000/api/users')
        .then(res => res.json())
        .then(data => {
          if (data.status === 'Success') setUsers(data.data);
        })
        .catch(error => console.error("Error fetching users:", error));
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setFormData({
      user_id: '',
      task_name: '',
      description: '',
      task_date: new Date().toISOString().split('T')[0],
      status: 'Pending'
    });
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (task) => {
    setFormData({
      user_id: task.user_id || '',
      task_name: task.task_name,
      description: task.description || '',
      task_date: task.task_date ? task.task_date.split('T')[0] : new Date().toISOString().split('T')[0],
      status: task.status
    });
    setEditingId(task.id);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setConfirmModal({
      show: true,
      title: language === 'ID' ? 'Hapus Tugas' : 'Delete Task',
      message: language === 'ID' 
        ? 'Apakah Anda yakin ingin menghapus tugas ini? Tindakan ini tidak dapat dibatalkan.' 
        : 'Are you sure you want to delete this task? This action cannot be undone.',
      onConfirm: () => {
        apiFetch(`http://localhost:8000/api/tasks/${id}`, {
          method: 'DELETE'
        })
          .then(res => res.json())
          .then(data => {
            if (data.status === 'Success') {
              fetchTasks();
            } else {
              alert('Gagal menghapus tugas');
            }
          })
          .catch(err => console.error(err));
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const handleStatusChange = (taskId, newStatus) => {
    apiFetch(`http://localhost:8000/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'Success') {
          fetchTasks();
        } else {
          alert('Gagal merubah status tugas');
        }
      })
      .catch(err => console.error(err));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = editingId 
      ? `http://localhost:8000/api/tasks/${editingId}`
      : 'http://localhost:8000/api/tasks';
    const method = editingId ? 'PUT' : 'POST';

    const payload = {
      ...formData,
      user_id: parseInt(formData.user_id)
    };

    apiFetch(url, {
      method,
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'Success') {
          setShowModal(false);
          setEditingId(null);
          fetchTasks();
        } else {
          alert('Gagal menyimpan tugas: ' + data.detail);
        }
      })
      .catch(err => console.error(err));
  };

  // Hitung stats untuk grafik
  const pendingCount = tasks.filter(t => t.status === 'Pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;

  const areaChartData = [
    { name: t.pending, value: pendingCount },
    { name: t.inProgress, value: inProgressCount },
    { name: t.completed, value: completedCount }
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-semibold text-gray-500 bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#7b3fe4] border-t-transparent rounded-full animate-spin"></div>
          <span>Memuat Tugas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER PANEL */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-50 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">{t.title}</h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">
            {isKaryawan ? t.subtitleKaryawan : t.subtitleAdmin}
          </p>
        </div>
        {!isKaryawan && (
          <button 
            onClick={openAddModal} 
            className="bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] text-white font-bold text-xs py-2.5 px-5 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/10 hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus size={14} /> {t.addTask}
          </button>
        )}
      </div>

      {/* 2. STATS & CHART ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Ringkasan */}
        <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <ClipboardList className="text-[#7b3fe4]" size={24} />
            <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-tight">{t.summary}</h2>
          </div>
          <div className="space-y-3.5">
            <div className="flex justify-between items-center bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/50">
              <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5">
                <AlertCircle size={14} /> {t.pending}
              </span>
              <span className="text-sm font-black text-amber-700">{pendingCount}</span>
            </div>
            <div className="flex justify-between items-center bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50">
              <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                <Clock size={14} /> {t.inProgress}
              </span>
              <span className="text-sm font-black text-blue-700">{inProgressCount}</span>
            </div>
            <div className="flex justify-between items-center bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50">
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> {t.completed}
              </span>
              <span className="text-sm font-black text-emerald-700">{completedCount}</span>
            </div>
          </div>
        </div>

        {/* Recharts Chart Column */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-50 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2 self-start">{t.visualTitle}</h3>
          {tasks.length > 0 ? (
            <div className="w-full h-40 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTaskArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7b3fe4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#7b3fe4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#7b3fe4" fillOpacity={1} fill="url(#colorTaskArea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-xs font-bold text-gray-400 py-10">{t.visualEmpty}</div>
          )}
        </div>
      </div>

      {/* 3. LIST TUGAS TABLE / CARD */}
      <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.listTitle}</h2>
          <span className="text-[10px] bg-[#7b3fe4]/10 text-[#7b3fe4] font-black px-2 py-0.5 rounded-full">
            {t.total}: {tasks.length}
          </span>
        </div>
        
        {tasks.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-semibold text-xs">
            <ClipboardList className="mx-auto mb-2 text-gray-300" size={32} />
            {t.noTasks}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold tracking-wider uppercase border-b border-gray-100">
                  <th className="p-4">{t.taskName}</th>
                  {!isKaryawan && <th className="p-4">{t.employee}</th>}
                  <th className="p-4">{t.date}</th>
                  <th className="p-4">{t.status}</th>
                  <th className="p-4 text-right">{(language === 'ID' ? 'Aksi' : 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-600">
                {tasks.map(task => (
                  <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-800 text-sm">{task.task_name}</p>
                      {task.description && <p className="text-gray-400 text-xs font-medium mt-0.5">{task.description}</p>}
                    </td>
                    {!isKaryawan && (
                      <td className="p-4 text-gray-800 font-bold">{task.user_name || '-'}</td>
                    )}
                    <td className="p-4 text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-gray-400" />
                        {task.task_date ? new Date(task.task_date).toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      {isKaryawan ? (
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 cursor-pointer focus:outline-none focus:border-[#7b3fe4]"
                          style={{ borderLeft: `3px solid ${COLORS[task.status]}` }}
                        >
                          <option value="Pending">{t.pending}</option>
                          <option value="In Progress">{t.inProgress}</option>
                          <option value="Completed">{t.completed}</option>
                        </select>
                      ) : (
                        <span 
                          className="px-2.5 py-0.5 text-[9px] font-bold rounded-full"
                          style={{ backgroundColor: COLORS[task.status] + '15', color: COLORS[task.status] }}
                        >
                          {task.status === 'Pending' ? t.pending : task.status === 'In Progress' ? t.inProgress : t.completed}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {isKaryawan ? (
                        <span className="text-gray-400 text-[10px]">{t.onlyEmployee}</span>
                      ) : (
                        <div className="flex gap-3 justify-end">
                          <button 
                            onClick={() => handleEdit(task)} 
                            className="text-[#7b3fe4] hover:text-[#3a6bf6] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 size={12} /> {t.edit}
                          </button>
                          <button 
                            onClick={() => handleDelete(task.id)} 
                            className="text-red-600 hover:text-red-800 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={12} /> {t.delete}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. MODAL ADD/EDIT TASK */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-scale-up">
            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-50">
              {editingId ? t.modalEdit : t.modalAdd}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{t.assignedEmployee}</label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#7b3fe4]"
                  required
                >
                  <option value="">{t.chooseEmployee}</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.role_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{t.taskName}</label>
                <input
                  type="text"
                  value={formData.task_name}
                  onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#7b3fe4]"
                  placeholder={t.placeholderName}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{t.description}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#7b3fe4] resize-none"
                  placeholder={t.placeholderDesc}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{t.date}</label>
                  <input
                    type="date"
                    value={formData.task_date}
                    onChange={(e) => setFormData({ ...formData, task_date: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#7b3fe4]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{t.status}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#7b3fe4]"
                  >
                    <option value="Pending">{t.pending}</option>
                    <option value="In Progress">{t.inProgress}</option>
                    <option value="Completed">{t.completed}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md shadow-blue-500/10 hover:shadow-lg transition-all cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ====== CUSTOM CONFIRMATION MODAL ====== */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 flex flex-col items-center text-center space-y-4 animate-scale-up">
            <div className="p-3 bg-red-50 text-red-500 rounded-full">
              <AlertTriangle size={28} />
            </div>
            
            <div className="space-y-1.5 w-full">
              <h3 className="text-base font-extrabold text-gray-800">{confirmModal.title}</h3>
              <p className="text-xs text-gray-400 font-semibold leading-relaxed px-2">{confirmModal.message}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5 w-full pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                {t.cancel || 'Batal'}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-red-500/10 transition-colors cursor-pointer"
              >
                {language === 'ID' ? 'Hapus' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
