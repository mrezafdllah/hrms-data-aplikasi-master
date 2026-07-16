import React, { useState, useEffect } from 'react';
import { Home, Users, Shield, Building2, Briefcase, MapPin, Menu, X, LogOut, UserCircle, CheckSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const menuTranslations = {
  ID: {
    summary: 'Ringkasan',
    roles: 'Peran',
    companies: 'Perusahaan',
    jobs: 'Pekerjaan',
    positions: 'Jabatan',
    users: 'Karyawan',
    tasks: 'Tugas Harian',
    profile: 'Profil Saya',
    logout: 'Keluar'
  },
  EN: {
    summary: 'Summary',
    roles: 'Roles',
    companies: 'Companies',
    jobs: 'Jobs',
    positions: 'Positions',
    users: 'Users',
    tasks: 'Daily Tasks',
    profile: 'My Profile',
    logout: 'Logout'
  }
};

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const role = localStorage.getItem('role');

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

  const t = menuTranslations[language] || menuTranslations.ID;

  // Menu berdasarkan role dan terjemahan dinamis
  const allMenuItems = [
    { path: '/', name: t.summary, icon: <Home size={18} />, roles: ['Super Admin', 'Admin HR', 'Karyawan'] },
    { path: '/roles', name: t.roles, icon: <Shield size={18} />, roles: ['Super Admin', 'Admin HR'] },
    { path: '/companies', name: t.companies, icon: <Building2 size={18} />, roles: ['Super Admin', 'Admin HR'] },
    { path: '/jobs', name: t.jobs, icon: <Briefcase size={18} />, roles: ['Super Admin', 'Admin HR'] },
    { path: '/positions', name: t.positions, icon: <MapPin size={18} />, roles: ['Super Admin', 'Admin HR'] },
    { path: '/users', name: t.users, icon: <Users size={18} />, roles: ['Super Admin', 'Admin HR'] },
    { path: '/tasks', name: t.tasks, icon: <CheckSquare size={18} />, roles: ['Super Admin', 'Admin HR', 'Karyawan'] },
    { path: '/profile', name: t.profile, icon: <UserCircle size={18} />, roles: ['Super Admin', 'Admin HR', 'Karyawan'] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(role));
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile menu header */}
      <div className="md:hidden p-4 bg-white shadow-sm flex justify-between items-center fixed top-0 w-full z-20 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="relative w-6 h-6 flex items-center justify-center">
            <div className="absolute w-1.5 h-5 bg-gradient-to-b from-[#7b3fe4] to-[#3a6bf6] rounded-full transform rotate-[30deg] -translate-x-1.5"></div>
            <div className="absolute w-1.5 h-5 bg-gradient-to-b from-[#7b3fe4] to-[#3a6bf6] rounded-full transform rotate-[30deg] translate-x-1"></div>
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-800">Workwave</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 focus:outline-none">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 bg-white w-64 border-r border-gray-100 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-10 flex flex-col justify-between`}>
        {/* Logo Header */}
        <div className="p-6 hidden md:block border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <div className="absolute w-1.5 h-5 bg-gradient-to-b from-[#7b3fe4] to-[#3a6bf6] rounded-full transform rotate-[30deg] -translate-x-1.5"></div>
              <div className="absolute w-1.5 h-5 bg-gradient-to-b from-[#7b3fe4] to-[#3a6bf6] rounded-full transform rotate-[30deg] translate-x-1"></div>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">Workwave</span>
          </div>
          <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{role}</p>
        </div>
        
        {/* Menu Items */}
        <nav className="mt-20 md:mt-6 px-4 space-y-1 flex-1 overflow-y-auto min-h-0">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm ${
                isActive(item.path) 
                  ? 'bg-gradient-to-r from-[#7b3fe4] to-[#3a6bf6] text-white font-semibold shadow-md shadow-blue-500/10' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <span className={isActive(item.path) ? 'text-white' : 'text-gray-400'}>
                {item.icon}
              </span>
              {item.name}
            </Link>
          ))}
        </nav>
        
        {/* User Card & Log Out */}
        <div className="p-4 border-t border-gray-50 bg-gray-50/50 m-4 rounded-xl flex-shrink-0">
          <div className="px-2 py-1.5 mb-2">
            <p className="text-sm font-semibold text-gray-800 truncate">{localStorage.getItem('name') || 'Guest'}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">{role}</p>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('role');
              localStorage.removeItem('name');
              window.location.href = '/login';
            }} 
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg transition-colors text-red-600 hover:bg-red-50 font-semibold text-sm cursor-pointer"
          >
            <LogOut size={16} />
            {t.logout}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
