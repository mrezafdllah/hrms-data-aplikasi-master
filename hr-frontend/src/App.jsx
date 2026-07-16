import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Roles from './pages/Roles';
import Companies from './pages/Companies';
import Jobs from './pages/Jobs';
import Positions from './pages/Positions';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Tasks from './pages/Tasks';
import './index.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'Karyawan' ? '/profile' : '/'} replace />;
  }

  return children;
};

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  // Inactivity timeout handler
  useEffect(() => {
    const checkSession = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const lastActive = localStorage.getItem('lastActiveTime');
      const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

      if (lastActive) {
        const timeDiff = Date.now() - parseInt(lastActive, 10);
        if (timeDiff > INACTIVITY_TIMEOUT) {
          // Clear session
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('name');
          localStorage.removeItem('profile_picture');
          localStorage.removeItem('lastActiveTime');
          window.location.href = '/login';
          return;
        }
      }
    };

    // Run check immediately on mount/navigation
    checkSession();

    // Reset inactivity timestamp on user interactions
    const resetTimer = () => {
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.setItem('lastActiveTime', Date.now().toString());
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Check every 10 seconds
    const intervalId = setInterval(checkSession, 10000);

    // Initialize timer
    resetTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      clearInterval(intervalId);
    };
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {!isLoginPage && <Sidebar />}
      <div className={`flex-1 ${!isLoginPage ? 'md:ml-64 p-8' : ''} overflow-y-auto`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Admin HR', 'Karyawan']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/roles" element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Admin HR']}>
              <Roles />
            </ProtectedRoute>
          } />
          <Route path="/companies" element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Admin HR']}>
              <Companies />
            </ProtectedRoute>
          } />
          <Route path="/jobs" element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Admin HR']}>
              <Jobs />
            </ProtectedRoute>
          } />
          <Route path="/positions" element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Admin HR']}>
              <Positions />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Admin HR']}>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Admin HR', 'Karyawan']}>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Admin HR', 'Karyawan']}>
              <Tasks />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
}

export default App;