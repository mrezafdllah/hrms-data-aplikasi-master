import { apiFetch, API_BASE_URL } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Bell, ChevronDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, AlertCircle, Plus, Edit2, Trash2, X, Check } from 'lucide-react';

const AVATAR_COLORS = [
  'from-pink-400 to-rose-500',
  'from-purple-400 to-indigo-500',
  'from-cyan-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-violet-400 to-fuchsia-500',
  'from-sky-400 to-blue-600'
];

const translations = {
  ID: {
    overview: "Berikut ringkasan aktivitas Anda hari ini",
    employee: "Karyawan",
    active: "Aktif",
    inactive: "Nonaktif",
    companies: "Perusahaan",
    registered: "Terdaftar",
    totalEntities: "Total Entitas",
    status: "Status",
    positionsJobs: "Jabatan & Pekerjaan",
    available: "Tersedia",
    positions: "Jabatan",
    jobs: "Pekerjaan",
    distributionChart: "Grafik Distribusi Karyawan",
    dailyTasks: "Status Tugas Harian",
    taskStatsDesc: "Statistik penyelesaian tugas karyawan",
    viewAllTasks: "Lihat Semua Tugas",
    pending: "Tertunda",
    inProgress: "Sedang Berjalan",
    completed: "Selesai",
    noTasksToday: "Belum ada tugas hari ini.",
    scheduleForDate: "Jadwal Tanggal",
    events: "Kegiatan",
    noSchedules: "Tidak ada jadwal pada tanggal ini.",
    noticeboard: "Noticeboard",
    addNotice: "Tambah Pengumuman",
    viewAllNotices: "Lihat Semua Pengumuman",
    subject: "Subjek",
    description: "Deskripsi",
    startDate: "Tanggal Mulai",
    endDate: "Tanggal Selesai",
    priority: "Prioritas",
    audience: "Audiens",
    noNotices: "Belum ada pengumuman hari ini.",
    addNoticeTitle: "Tambah Pengumuman Baru",
    editNoticeTitle: "Edit Pengumuman",
    subjectLabel: "Subject / Judul",
    descLabel: "Deskripsi / Isi Pengumuman",
    cancel: "Batal",
    save: "Simpan",
    assignedEmployee: "Karyawan Yang Ditugaskan",
    activityName: "Nama Kegiatan / Judul",
    activityDesc: "Deskripsi Kegiatan",
    date: "Tanggal",
    startTime: "Jam Mulai",
    endTime: "Jam Selesai",
    addScheduleTitle: "Tambah Jadwal Baru",
    editScheduleTitle: "Edit Jadwal Kerja",
    notifications: "Notifikasi",
    noNotifications: "Tidak ada notifikasi baru hari ini.",
    actionNeeded: "Action needed",
    actionNeededDesc: "Tugas pending memerlukan perhatian Anda",
    viewAllActions: "View all actions",
    weekdays: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
  },
  EN: {
    overview: "Here Is Your Overview For Today",
    employee: "Employee",
    active: "Active",
    inactive: "Inactive",
    companies: "Companies",
    registered: "Registered",
    totalEntities: "Total Entities",
    status: "Status",
    positionsJobs: "Positions & Jobs",
    available: "Available",
    positions: "Positions",
    jobs: "Jobs",
    distributionChart: "Employee Distribution Chart",
    dailyTasks: "Daily Task Status",
    taskStatsDesc: "Employee task completion statistics",
    viewAllTasks: "View All Tasks",
    pending: "Pending",
    inProgress: "In Progress",
    completed: "Completed",
    noTasksToday: "No tasks today.",
    scheduleForDate: "Schedule for Date",
    events: "Events",
    noSchedules: "No schedules on this date.",
    noticeboard: "Noticeboard",
    addNotice: "Add Announcement",
    viewAllNotices: "View All Notices",
    subject: "Subject",
    description: "Description",
    startDate: "Start Date",
    endDate: "End Date",
    priority: "Priority",
    audience: "Audience",
    noNotices: "No announcements today.",
    addNoticeTitle: "Add New Announcement",
    editNoticeTitle: "Edit Announcement",
    subjectLabel: "Subject / Title",
    descLabel: "Description / Announcement Content",
    cancel: "Cancel",
    save: "Save",
    assignedEmployee: "Assigned Employee",
    activityName: "Activity Name / Title",
    activityDesc: "Activity Description",
    date: "Date",
    startTime: "Start Time",
    endTime: "End Time",
    addScheduleTitle: "Add New Schedule",
    editScheduleTitle: "Edit Work Schedule",
    notifications: "Notifications",
    noNotifications: "No new notifications today.",
    actionNeeded: "Action needed",
    actionNeededDesc: "Pending tasks need your attention",
    viewAllActions: "View all actions",
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  }
};

const Dashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalCompanies: 0, totalPositions: 0, totalJobs: 0, activeUsers: 0, inactiveUsers: 0, roleStats: [], taskStats: [] });
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [notices, setNotices] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  // Header state
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'ID');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  
  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    user_id: '',
    title: '',
    description: '',
    schedule_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '10:00'
  });

  // Notice Modal State
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState(null);
  const [noticeForm, setNoticeForm] = useState({
    subject: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    priority: 'Medium',
    audience: 'All Departments'
  });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const name = localStorage.getItem('name') || 'Administrator';
  const role = localStorage.getItem('role');
  const isAdmin = role === 'Super Admin' || role === 'Admin HR';
  
  const t = translations[language] || translations.ID;

  const fetchData = () => {
    Promise.all([
      apiFetch('/api/dashboard-stats').then(res => res.json()),
      apiFetch('/api/users').then(res => res.json()),
      apiFetch('/api/schedules').then(res => res.json()),
      apiFetch('/api/notices').then(res => res.json()),
      apiFetch('/api/profile').then(res => res.json())
    ])
      .then(([statsData, usersData, schedulesData, noticesData, profileData]) => {
        if (statsData.status === "Success") setStats(statsData.data);
        if (usersData.status === "Success") setUsers(usersData.data);
        if (schedulesData.status === "Success") setSchedules(schedulesData.data);
        if (noticesData.status === "Success") setNotices(noticesData.data);
        if (profileData.status === "Success") {
          setMyProfile(profileData.data);
          localStorage.setItem('profile_picture', profileData.data.profile_picture || '');
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Gagal mengambil data:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-semibold text-gray-500 bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#7b3fe4] border-t-transparent rounded-full animate-spin"></div>
          <span>Memuat Statistik...</span>
        </div>
      </div>
    );
  }

  // Pre-configured data for chart if empty
  const defaultChartData = [
    { name: 'Finance', value: 4 },
    { name: 'Development', value: 3 },
    { name: 'Design', value: 2 }
  ];
  const chartData = stats.roleStats && stats.roleStats.length > 0
    ? stats.roleStats.map(item => ({ name: item.name, value: parseInt(item.value) }))
    : defaultChartData;

  // Calendar logic
  const getDaysInMonth = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const numberOfDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= numberOfDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  const formattedSelectedDate = selectedDate.toISOString().split('T')[0];
  const selectedDateSchedules = schedules.filter(s => s.schedule_date.split('T')[0] === formattedSelectedDate);

  // Schedule CRUD functions
  const openAddSchedule = () => {
    setScheduleForm({
      user_id: users.length > 0 ? String(users[0].id) : '',
      title: '',
      description: '',
      schedule_date: formattedSelectedDate,
      start_time: '09:00',
      end_time: '10:00'
    });
    setEditingScheduleId(null);
    setShowScheduleModal(true);
  };

  const openEditSchedule = (sch) => {
    setScheduleForm({
      user_id: String(sch.user_id),
      title: sch.title,
      description: sch.description || '',
      schedule_date: sch.schedule_date.split('T')[0],
      start_time: sch.start_time,
      end_time: sch.end_time
    });
    setEditingScheduleId(sch.id);
    setShowScheduleModal(true);
  };

  const handleDeleteSchedule = (id) => {
    setConfirmModal({
      show: true,
      title: language === 'ID' ? 'Hapus Jadwal' : 'Delete Schedule',
      message: language === 'ID' 
        ? 'Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan.' 
        : 'Are you sure you want to delete this schedule? This action cannot be undone.',
      onConfirm: () => {
        apiFetch(`/api/schedules/${id}`, {
          method: 'DELETE'
        })
          .then(res => res.json())
          .then(data => {
            if (data.status === 'Success') {
              fetchData();
            } else {
              alert('Gagal menghapus jadwal');
            }
          })
          .catch(err => console.error(err));
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    const url = editingScheduleId 
      ? `/api/schedules/${editingScheduleId}`
      : '/api/schedules';
    const method = editingScheduleId ? 'PUT' : 'POST';

    const payload = {
      ...scheduleForm,
      user_id: parseInt(scheduleForm.user_id)
    };

    apiFetch(url, {
      method,
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'Success') {
          setShowScheduleModal(false);
          fetchData();
        } else {
          alert('Gagal menyimpan jadwal: ' + data.detail);
        }
      })
      .catch(err => console.error(err));
  };

  // Notice CRUD functions
  const openAddNotice = () => {
    setNoticeForm({
      subject: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      priority: 'Medium',
      audience: 'All Departments'
    });
    setEditingNoticeId(null);
    setShowNoticeModal(true);
  };

  const openEditNotice = (n) => {
    setNoticeForm({
      subject: n.subject,
      description: n.description || '',
      start_date: n.start_date.split('T')[0],
      end_date: n.end_date.split('T')[0],
      priority: n.priority,
      audience: n.audience
    });
    setEditingNoticeId(n.id);
    setShowNoticeModal(true);
  };

  const handleDeleteNotice = (id) => {
    setConfirmModal({
      show: true,
      title: language === 'ID' ? 'Hapus Pengumuman' : 'Delete Announcement',
      message: language === 'ID' 
        ? 'Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini tidak dapat dibatalkan.' 
        : 'Are you sure you want to delete this announcement? This action cannot be undone.',
      onConfirm: () => {
        apiFetch(`/api/notices/${id}`, {
          method: 'DELETE'
        })
          .then(res => res.json())
          .then(data => {
            if (data.status === 'Success') {
              fetchData();
            } else {
              alert('Gagal menghapus pengumuman');
            }
          })
          .catch(err => console.error(err));
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const handleNoticeSubmit = (e) => {
    e.preventDefault();
    const url = editingNoticeId 
      ? `/api/notices/${editingNoticeId}`
      : '/api/notices';
    const method = editingNoticeId ? 'PUT' : 'POST';

    apiFetch(url, {
      method,
      body: JSON.stringify(noticeForm)
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'Success') {
          setShowNoticeModal(false);
          fetchData();
        } else {
          alert('Gagal menyimpan pengumuman: ' + data.detail);
        }
      })
      .catch(err => console.error(err));
  };

  const daysGrid = getDaysInMonth(calendarMonth);
  const monthName = calendarMonth.toLocaleString(language === 'ID' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' });

  // Get real tasks stats
  const pendingCount = parseInt(stats.taskStats?.find(t => t.name === 'Pending')?.value || 0) +
                       parseInt(stats.taskStats?.find(t => t.name === 'In Progress')?.value || 0);

  return (
    <div className="space-y-6 pb-12 bg-[#fcfdff] min-h-screen">
      {/* 1. TOP HEADER PANEL */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
            {language === 'ID' ? `Halo ${name.split(' ')[0]}!` : `Hi ${name.split(' ')[0]}!`}
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-0.5">
            {t.overview}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Active Language Selector */}
          <div className="relative">
            <div 
              onClick={() => {
                setShowLanguageDropdown(!showLanguageDropdown);
                setShowNotificationDropdown(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <span>🌐</span>
              <span>{language}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </div>
            
            {showLanguageDropdown && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                <button 
                  onClick={() => {
                    setLanguage('ID');
                    localStorage.setItem('language', 'ID');
                    window.dispatchEvent(new Event('languageChange'));
                    setShowLanguageDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 flex items-center gap-2 ${language === 'ID' ? 'text-[#7b3fe4]' : 'text-gray-600'}`}
                >
                  🇮🇩 Indonesia {language === 'ID' && '✓'}
                </button>
                <button 
                  onClick={() => {
                    setLanguage('EN');
                    localStorage.setItem('language', 'EN');
                    window.dispatchEvent(new Event('languageChange'));
                    setShowLanguageDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-gray-50 flex items-center gap-2 ${language === 'EN' ? 'text-[#7b3fe4]' : 'text-gray-600'}`}
                >
                  🇬🇧 English {language === 'EN' && '✓'}
                </button>
              </div>
            )}
          </div>

          {/* Active Notification Bell Popover */}
          <div className="relative">
            <div 
              onClick={() => {
                setShowNotificationDropdown(!showNotificationDropdown);
                setShowLanguageDropdown(false);
              }}
              className="p-2.5 rounded-full bg-gray-50 border border-gray-100 text-gray-500 relative cursor-pointer hover:bg-gray-100 transition-all"
            >
              <Bell size={18} />
              {(pendingCount > 0 || selectedDateSchedules.length > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </div>

            {showNotificationDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-extrabold text-xs text-gray-800 uppercase tracking-tight">{t.notifications}</span>
                  <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-black">
                    {pendingCount} {t.pending}
                  </span>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {pendingCount > 0 && (
                    <div className="flex gap-2.5 items-start p-2 hover:bg-gray-50 rounded-xl transition-colors">
                      <div className="p-1.5 bg-amber-50 rounded-lg text-amber-500">
                        <AlertCircle size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-700">{t.dailyTasks} ({t.pending})</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{language === 'ID' ? `Ada ${pendingCount} tugas pending di dashboard Anda.` : `There are ${pendingCount} pending tasks on your dashboard.`}</p>
                      </div>
                    </div>
                  )}

                  {selectedDateSchedules.length > 0 ? (
                    selectedDateSchedules.map(sch => (
                      <div key={sch.id} className="flex gap-2.5 items-start p-2 hover:bg-gray-50 rounded-xl transition-colors">
                        <div className="p-1.5 bg-blue-50 rounded-lg text-blue-500">
                          <Clock size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-gray-700">{sch.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{sch.start_time} - {sch.end_time} • {sch.user_name || 'Semua'}</p>
                        </div>
                      </div>
                    ))
                  ) : null}

                  {pendingCount === 0 && selectedDateSchedules.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-xs font-semibold">
                      {t.noNotifications}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sync Header Avatar Profile Picture */}
          {myProfile?.profile_picture ? (
            <img 
              src={`${API_BASE_URL}${myProfile.profile_picture}`} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full object-cover shadow-md shadow-[#7b3fe4]/10 border border-gray-100" 
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7b3fe4] to-[#3a6bf6] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/10">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* 2. STATS ROW & STREAM GRAPH */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Employee Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-50 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{t.employee}</span>
                <span className="text-2xl font-black text-gray-800 block mt-1.5">{stats.totalUsers || 0}</span>
              </div>
              <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full">{stats.activeUsers || 0} {t.active}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6 border-t border-gray-50 pt-4">
              <div>
                <span className="text-2xl font-bold text-emerald-500 block">{stats.activeUsers || 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.active}</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-400 block">{stats.inactiveUsers || 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.inactive}</span>
              </div>
            </div>
          </div>

          {/* Companies Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-50 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{t.companies}</span>
                <span className="text-2xl font-black text-gray-800 block mt-1.5">{stats.totalCompanies || 0}</span>
              </div>
              <span className="bg-purple-50 text-[#7b3fe4] text-xs font-bold px-2.5 py-1 rounded-full">{t.registered}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6 border-t border-gray-50 pt-4">
              <div>
                <span className="text-2xl font-bold text-[#7b3fe4] block">{stats.totalCompanies || 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.totalEntities}</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-[#3a6bf6] block">{t.active}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.status}</span>
              </div>
            </div>
          </div>

          {/* Positions & Jobs Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-50 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{t.positionsJobs}</span>
                <span className="text-2xl font-black text-gray-800 block mt-1.5">{stats.totalPositions || 0}</span>
              </div>
              <span className="bg-amber-50 text-amber-600 text-xs font-bold px-2.5 py-1 rounded-full">{t.available}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6 border-t border-gray-50 pt-4">
              <div>
                <span className="text-2xl font-bold text-emerald-500 block">{stats.totalPositions || 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.positions}</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-blue-500 block">{stats.totalJobs || 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.jobs}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Stream Graph (AreaChart) Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-50 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-between">
          <div className="w-full text-left">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{t.distributionChart}</span>
          </div>
          <div className="relative w-full h-36 flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7b3fe4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#7b3fe4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 8 }} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#7b3fe4" fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-3 text-[10px] w-full flex-wrap">
            {chartData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full block bg-[#7b3fe4]"></span>
                <span className="text-gray-500 font-semibold">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TASK STATS SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm">
        <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-3">
          <div>
            <h2 className="text-lg font-extrabold text-gray-800 tracking-tight">{t.dailyTasks}</h2>
            <p className="text-gray-400 text-xs font-semibold mt-0.5">{t.taskStatsDesc}</p>
          </div>
          <Link to="/tasks" className="text-[#7b3fe4] hover:text-[#3a6bf6] text-xs font-bold flex items-center gap-1">
            {t.viewAllTasks} <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 text-center">
              <span className="text-[10px] font-bold text-amber-500 uppercase block tracking-wider">{t.pending}</span>
              <span className="text-xl font-black text-amber-700 block mt-1">
                {stats.taskStats?.find(t => t.name === 'Pending')?.value || 0}
              </span>
            </div>
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 text-center">
              <span className="text-[10px] font-bold text-blue-500 uppercase block tracking-wider">{t.inProgress}</span>
              <span className="text-xl font-black text-blue-700 block mt-1">
                {stats.taskStats?.find(t => t.name === 'In Progress')?.value || 0}
              </span>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 text-center">
              <span className="text-[10px] font-bold text-emerald-500 uppercase block tracking-wider">{t.completed}</span>
              <span className="text-xl font-black text-emerald-700 block mt-1">
                {stats.taskStats?.find(t => t.name === 'Completed')?.value || 0}
              </span>
            </div>
          </div>

          <div className="lg:col-span-2 h-24 w-full">
            {stats.taskStats && stats.taskStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  {
                    name: t.pending,
                    value: parseInt(stats.taskStats?.find(t => t.name === 'Pending')?.value || 0)
                  },
                  {
                    name: t.inProgress,
                    value: parseInt(stats.taskStats?.find(t => t.name === 'In Progress')?.value || 0)
                  },
                  {
                    name: t.completed,
                    value: parseInt(stats.taskStats?.find(t => t.name === 'Completed')?.value || 0)
                  }
                ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTask" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTask)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-bold text-gray-400">
                {t.noTasksToday}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. MIDDLE PANEL: CALENDAR, SCHEDULE, & ACTION CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dynamic Interactive Calendar Widget */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-50 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="font-extrabold text-gray-800 text-sm tracking-tight">{monthName}</span>
            <div className="flex gap-1.5">
              <button onClick={handlePrevMonth} className="p-1 rounded bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-600"><ChevronLeft size={16} /></button>
              <button onClick={handleNextMonth} className="p-1 rounded bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-600"><ChevronRight size={16} /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            {t.weekdays.map((wd, i) => <span key={i}>{wd}</span>)}
          </div>
          
          <div className="grid grid-cols-7 gap-y-1 text-center text-xs font-semibold text-gray-700">
            {daysGrid.map((day, idx) => {
              if (!day) return <span key={`empty-${idx}`} className="p-2 text-gray-200">-</span>;
              
              const isSelected = day.toDateString() === selectedDate.toDateString();
              const isToday = day.toDateString() === new Date().toDateString();
              const dateStr = day.toISOString().split('T')[0];
              const hasEvents = schedules.some(s => s.schedule_date.split('T')[0] === dateStr);

              return (
                <button
                  key={`day-${idx}`}
                  onClick={() => setSelectedDate(day)}
                  className={`p-2 rounded-full relative w-8 h-8 flex items-center justify-center mx-auto transition-all ${
                    isSelected 
                      ? 'bg-[#7b3fe4] text-white font-bold shadow-md shadow-[#7b3fe4]/25' 
                      : isToday 
                        ? 'bg-[#ff5f2d] text-white font-bold shadow-md shadow-[#ff5f2d]/20'
                        : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {day.getDate()}
                  {hasEvents && !isSelected && !isToday && (
                    <span className="absolute bottom-1 w-1 h-1 bg-[#7b3fe4] rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Schedule List */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-50 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="font-extrabold text-gray-800 text-sm tracking-tight">{t.scheduleForDate} {selectedDate.getDate()}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">{selectedDateSchedules.length} {t.events}</span>
              {isAdmin && (
                <button 
                  onClick={openAddSchedule} 
                  className="p-1.5 rounded-lg bg-[#7b3fe4]/10 hover:bg-[#7b3fe4]/20 text-[#7b3fe4] transition-colors"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
            {selectedDateSchedules.length > 0 ? (
              selectedDateSchedules.map((sch) => (
                <div key={sch.id} className="flex gap-3 items-center">
                  <span className="text-[9px] font-bold text-gray-400 uppercase w-14 tracking-wide text-right">
                    {sch.start_time}
                  </span>
                  <div className="flex-1 bg-gray-50 border border-gray-100 py-2 px-3 rounded-xl flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-700">{sch.title}</span>
                      <span className="text-[9px] text-gray-400 mt-0.5">
                        {sch.start_time} - {sch.end_time} • {sch.user_name || 'Semua'}
                      </span>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditSchedule(sch)} className="p-1 hover:text-[#7b3fe4] text-gray-400">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDeleteSchedule(sch.id)} className="p-1 hover:text-red-500 text-gray-400">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                <CalendarIcon size={24} className="opacity-40" />
                <span className="text-xs font-semibold">{t.noSchedules}</span>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Action Needed Red Card (Linked to tasks) */}
        <div className="lg:col-span-3 bg-red-600 text-white p-6 rounded-2xl shadow-lg shadow-red-500/20 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full pointer-events-none"></div>
          
          <div className="z-10">
            <AlertTriangle size={32} className="text-white opacity-95 mb-4" />
            <h3 className="text-xl font-extrabold tracking-tight">{pendingCount} {t.actionNeeded}</h3>
            <p className="text-white/80 text-xs mt-1 font-semibold">{t.actionNeededDesc}</p>
          </div>
          
          <div className="z-10 mt-6 pt-4 border-t border-white/25 flex items-center justify-between">
            <Link to="/tasks" className="font-bold text-xs uppercase tracking-wider hover:underline text-white flex items-center gap-1.5">
              {t.viewAllActions}
            </Link>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* 4. EMPLOYEE DIRECTORY SECTION */}
      <div className="bg-white p-5 rounded-2xl border border-gray-50 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-extrabold text-gray-800 text-sm tracking-tight">Employee Directory</span>
          <div className="flex gap-1.5">
            <button className="p-1 rounded bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-600"><ChevronLeft size={16} /></button>
            <button className="p-1 rounded bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-600"><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 pt-2">
          {users.slice(0, 7).map((user, idx) => {
            const initials = user.full_name
              ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              : 'U';
            const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            return (
              <div key={user.id} className="bg-gray-50/50 hover:bg-gray-50 border border-gray-100 p-4 rounded-xl flex flex-col items-center text-center transition-all">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${colorClass} text-white font-bold flex items-center justify-center text-xs mb-3 shadow-md`}>
                  {initials}
                </div>
                <h4 className="text-xs font-bold text-gray-800 truncate w-full">{user.full_name}</h4>
                <p className="text-[9px] text-gray-400 font-semibold truncate w-full mt-0.5">{user.position_name || '-'}</p>
                <p style={{ display: 'none' }}>{user.id}</p>
                <p className="text-[8px] text-gray-400 uppercase tracking-widest font-black mt-1.5">{user.company_name || 'CBN HRMS'}</p>
              </div>
            );
          })}
          {users.length === 0 && (
            <div className="col-span-full py-8 text-center text-gray-400 text-sm">No employees found.</div>
          )}
        </div>

        <div className="flex justify-start pt-2">
          <Link to="/users" className="bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] text-white font-bold text-xs py-2.5 px-5 rounded-full flex items-center gap-1.5 shadow-md shadow-blue-500/10 hover:shadow-lg transition-all cursor-pointer">
            Show all
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* 5. NOTICEBOARD */}
      <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
          <span className="font-extrabold text-gray-800 text-sm tracking-tight">{t.noticeboard}</span>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button 
                onClick={openAddNotice} 
                className="bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] text-white font-bold text-[10px] py-1.5 px-3 rounded-full flex items-center gap-1 shadow-sm"
              >
                <Plus size={10} /> {t.addNotice}
              </button>
            )}
            <span className="text-xs font-bold text-[#7b3fe4] hover:underline cursor-pointer">{t.viewAllNotices}</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] text-white text-xs font-bold tracking-wider uppercase">
                <th className="p-4 rounded-tl-2xl">{t.subject}</th>
                <th className="p-4">{t.description}</th>
                <th className="p-4">{t.startDate}</th>
                <th className="p-4">{t.endDate}</th>
                <th className="p-4">{t.priority}</th>
                <th className="p-4 rounded-tr-2xl">{t.audience}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-600 bg-white">
              {notices.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-gray-800 font-bold group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full block ${
                          n.priority === 'High' ? 'bg-red-500' : n.priority === 'Medium' ? 'bg-blue-500' : 'bg-amber-500'
                        }`}></span>
                        {n.subject}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditNotice(n)} className="p-1 hover:text-[#7b3fe4] text-gray-400">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => handleDeleteNotice(n.id)} className="p-1 hover:text-red-500 text-gray-400">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-gray-500 font-normal">{n.description || '-'}</td>
                  <td className="p-4">{new Date(n.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                  <td className="p-4">{new Date(n.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] ${
                      n.priority === 'High' ? 'bg-red-50 text-red-600' : n.priority === 'Medium' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {n.priority}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400">{n.audience}</td>
                </tr>
              ))}
              {notices.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 font-semibold">{t.noNotices}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====== MODAL: Add/Edit Schedule ====== */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-gray-800 text-sm">
                {editingScheduleId ? t.editScheduleTitle : t.addScheduleTitle}
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs font-semibold text-gray-600">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  {t.assignedEmployee}
                </label>
                <select
                  value={scheduleForm.user_id}
                  onChange={e => setScheduleForm(prev => ({ ...prev, user_id: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-gray-700 focus:outline-none"
                  required
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.role_name || 'Karyawan'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  {t.activityName}
                </label>
                <input
                  type="text"
                  value={scheduleForm.title}
                  onChange={e => setScheduleForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-gray-700 focus:outline-none"
                  placeholder="Masukkan nama kegiatan"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  {t.activityDesc}
                </label>
                <textarea
                  value={scheduleForm.description}
                  onChange={e => setScheduleForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-gray-700 focus:outline-none resize-none"
                  placeholder="Deskripsi opsional"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    {t.date}
                  </label>
                  <input
                    type="date"
                    value={scheduleForm.schedule_date}
                    onChange={e => setScheduleForm(prev => ({ ...prev, schedule_date: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-2 py-2 text-gray-700 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    {t.startTime}
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.start_time}
                    onChange={e => setScheduleForm(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-2 py-2 text-gray-700 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    {t.endTime}
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.end_time}
                    onChange={e => setScheduleForm(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-2 py-2 text-gray-700 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2 px-4 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="bg-[#7b3fe4] hover:bg-[#6832ca] text-white font-bold py-2 px-4 rounded-xl flex items-center gap-1 shadow-md"
                >
                  <Check size={14} /> {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== MODAL: Add/Edit Notice ====== */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-gray-800 text-sm">
                {editingNoticeId ? t.editNoticeTitle : t.addNoticeTitle}
              </h3>
              <button onClick={() => setShowNoticeModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleNoticeSubmit} className="space-y-4 text-xs font-semibold text-gray-600">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  {t.subjectLabel}
                </label>
                <input
                  type="text"
                  value={noticeForm.subject}
                  onChange={e => setNoticeForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-gray-700 focus:outline-none"
                  placeholder="Masukkan judul pengumuman"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  {t.descLabel}
                </label>
                <textarea
                  value={noticeForm.description}
                  onChange={e => setNoticeForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-gray-700 focus:outline-none resize-none"
                  placeholder="Masukkan isi pengumuman lengkap"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    {t.startDate}
                  </label>
                  <input
                    type="date"
                    value={noticeForm.start_date}
                    onChange={e => setNoticeForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-2 py-2 text-gray-700 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    {t.endDate}
                  </label>
                  <input
                    type="date"
                    value={noticeForm.end_date}
                    onChange={e => setNoticeForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-2 py-2 text-gray-700 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    {t.priority}
                  </label>
                  <select
                    value={noticeForm.priority}
                    onChange={e => setNoticeForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-gray-700 focus:outline-none"
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    {t.audience}
                  </label>
                  <input
                    type="text"
                    value={noticeForm.audience}
                    onChange={e => setNoticeForm(prev => ({ ...prev, audience: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-gray-700 focus:outline-none"
                    placeholder="Contoh: All Departments"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2 px-4 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="bg-[#7b3fe4] hover:bg-[#6832ca] text-white font-bold py-2 px-4 rounded-xl flex items-center gap-1 shadow-md"
                >
                  <Check size={14} /> {t.save}
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

export default Dashboard;
