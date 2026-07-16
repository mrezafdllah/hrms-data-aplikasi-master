import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

const translations = {
  ID: {
    loading: "Memuat Dashboard...",
    confirmTitle: "Konfirmasi",
    confirmLogoutMsg: "Apakah Anda yakin ingin logout?",
    cancelBtn: "Batal",
    logoutBtn: "Logout Sesi",
    hrManagement: "Manajemen HR",
    employeeDistribution: "Distribusi Karyawan",
    realtime: "Real-time",
    noDistribution: "Tidak ada data distribusi",
    activeEmployees: "Karyawan Aktif",
    readyToWork: "Siap bekerja",
    totalJobs: "Lowongan Pekerjaan",
    activeOpenings: "Lowongan aktif",
    todaySchedule: "Jadwal Hari Ini",
    noSchedules: "Tidak ada jadwal hari ini.",
    myTasks: "Tugas Saya",
    manageTasks: "Kelola Tugas",
    running: "Berjalan",
    completed: "Selesai",
    noRunningTasks: "Tidak ada tugas berjalan.",
    noCompletedTasks: "Tidak ada tugas selesai.",
    noticeboard: "Papan Pengumuman (Noticeboard)",
    noNotices: "Tidak ada pengumuman hari ini.",
    priority: "Prioritas",
    for: "Untuk",
    staff: "Staf",
    karyawan: "Karyawan",
  },
  EN: {
    loading: "Loading Dashboard...",
    confirmTitle: "Confirmation",
    confirmLogoutMsg: "Are you sure you want to logout?",
    cancelBtn: "Cancel",
    logoutBtn: "Logout Session",
    hrManagement: "HR Management",
    employeeDistribution: "Employee Distribution",
    realtime: "Real-time",
    noDistribution: "No distribution data",
    activeEmployees: "Active Employees",
    readyToWork: "Ready to work",
    totalJobs: "Total Jobs",
    activeOpenings: "Active openings",
    todaySchedule: "Today's Schedule",
    noSchedules: "No schedules today.",
    myTasks: "My Tasks",
    manageTasks: "Manage Tasks",
    running: "Running",
    completed: "Completed",
    noRunningTasks: "No running tasks.",
    noCompletedTasks: "No completed tasks.",
    noticeboard: "Noticeboard",
    noNotices: "No announcements today.",
    priority: "Priority",
    for: "For",
    staff: "Staff",
    karyawan: "Employee",
  }
};

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const itemWidth = (width - 40 - 24) / 3; // 40 is paddingHorizontal (20 on each side), 24 is space for 2 column gaps (12 each)
  const menuItemStyle = [styles.menuItem, { width: itemWidth }];

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<'ID' | 'EN'>('ID');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Today' | 'Completed'>('Today');

  const loadData = useCallback(async () => {
    const storedName = await AsyncStorage.getItem('name');
    const storedRole = await AsyncStorage.getItem('role');
    const storedLang = await AsyncStorage.getItem('language');
    
    if (storedName) setName(storedName);
    if (storedRole) setRole(storedRole);
    if (storedLang === 'EN') setLanguage('EN');
    else setLanguage('ID');

    try {
      const statsRes = await api.get('/dashboard-stats');
      if (statsRes.data?.status === 'Success') setStats(statsRes.data.data);

      const schedulesRes = await api.get('/schedules');
      if (schedulesRes.data?.status === 'Success') setSchedules(schedulesRes.data.data);

      const tasksRes = await api.get('/tasks');
      if (tasksRes.data?.status === 'Success') setTasks(tasksRes.data.data);

      const noticesRes = await api.get('/notices');
      if (noticesRes.data?.status === 'Success') setNotices(noticesRes.data.data);

      const profileRes = await api.get('/profile');
      if (profileRes.data?.status === 'Success') {
        setProfilePicture(profileRes.data.data.profile_picture);
      }
    } catch (e: any) {
      if (e?.response?.status === 401) return;
      console.error("Dashboard API load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const t = translations[language];

  const handleLogout = async () => {
    Alert.alert(t.confirmTitle, t.confirmLogoutMsg, [
      { text: t.cancelBtn, style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace('/login');
        }
      }
    ]);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySchedules = schedules.filter(s => s.schedule_date.split('T')[0] === todayStr);

  const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress');
  const completedTasks = tasks.filter(t => t.status === 'Completed');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7b3fe4" />
        <Text style={styles.loadingText}>{t.loading}</Text>
      </View>
    );
  }

  // Stream Graph calculation
  const totalEmployees = stats?.totalUsers || 1;
  const roleStats = stats?.roleStats || [];

  const getProfileImageUrl = () => {
    if (!profilePicture) return null;
    const baseUrl = api.defaults.baseURL?.replace('/api', '') || '';
    return `${baseUrl}${profilePicture}`;
  };

  const imageUrl = getProfileImageUrl();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* 1. HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <TouchableOpacity style={styles.avatarContainer} onPress={() => router.push('/profile')}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
            )}
          </TouchableOpacity>
          <View style={styles.nameContainer}>
            <Text style={styles.greetingText}>{name || t.karyawan} ❯</Text>
            <Text style={styles.roleText}>{role || t.staff}</Text>
          </View>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={22} color="#1e2022" />
            {(pendingTasks.length > 0 || todaySchedules.length > 0) && (
              <View style={styles.notificationDot} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. HR PORTAL MANAGEMENT MENU GRID */}
      <View style={styles.menuGridContainer}>
        <Text style={styles.menuGridTitle}>{t.hrManagement}</Text>
        <View style={styles.menuGrid}>
          {role === 'Karyawan' ? (
            <TouchableOpacity style={menuItemStyle} onPress={() => router.push('/profile')}>
              <View style={[styles.menuIconContainer, { backgroundColor: '#f5f3ff' }]}>
                <Ionicons name="person" size={22} color="#7b3fe4" />
              </View>
              <Text style={styles.menuItemLabel}>{language === 'ID' ? 'Profil Saya' : 'My Profile'}</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={menuItemStyle} onPress={() => router.push('/roles')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f5f3ff' }]}>
                  <Ionicons name="shield-checkmark" size={22} color="#7c3aed" />
                </View>
                <Text style={styles.menuItemLabel}>Roles</Text>
              </TouchableOpacity>

              <TouchableOpacity style={menuItemStyle} onPress={() => router.push('/companies')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="business" size={22} color="#3b82f6" />
                </View>
                <Text style={styles.menuItemLabel}>Companies</Text>
              </TouchableOpacity>

              <TouchableOpacity style={menuItemStyle} onPress={() => router.push('/jobs')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="briefcase" size={22} color="#10b981" />
                </View>
                <Text style={styles.menuItemLabel}>Jobs</Text>
              </TouchableOpacity>

              <TouchableOpacity style={menuItemStyle} onPress={() => router.push('/positions')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#fffbeb' }]}>
                  <Ionicons name="git-branch" size={22} color="#d97706" />
                </View>
                <Text style={styles.menuItemLabel}>Positions</Text>
              </TouchableOpacity>

              <TouchableOpacity style={menuItemStyle} onPress={() => router.push('/users')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#fff1f2' }]}>
                  <Ionicons name="people" size={22} color="#f43f5e" />
                </View>
                <Text style={styles.menuItemLabel}>Users</Text>
              </TouchableOpacity>

              <TouchableOpacity style={menuItemStyle} onPress={() => router.push('/profile')}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#f0fdfa' }]}>
                  <Ionicons name="person" size={22} color="#0d9488" />
                </View>
                <Text style={styles.menuItemLabel}>{language === 'ID' ? 'Profil' : 'Profile'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* 3. DYNAMIC ROLE DISTRIBUTION GRAPHIC */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>{t.employeeDistribution}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t.realtime}</Text>
          </View>
        </View>

        <View style={styles.streamContainer}>
          {roleStats.length > 0 ? (
            roleStats.map((item: any, index: number) => {
              const percentage = Math.round((parseInt(item.value) / totalEmployees) * 100);
              const colors = ['#7b3fe4', '#3b82f6', '#10b981', '#f59e0b'];
              const color = colors[index % colors.length];

              return (
                <View key={item.name} style={styles.streamItem}>
                  <View style={styles.streamMeta}>
                    <Text style={styles.streamName}>{item.name}</Text>
                    <Text style={styles.streamValue}>{item.value} ({percentage}%)</Text>
                  </View>
                  <View style={styles.streamTrack}>
                    <View style={[styles.streamFill, { width: `${percentage}%`, backgroundColor: color }]} />
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>{t.noDistribution}</Text>
          )}
        </View>
      </View>

      {/* 4. REAL-TIME METRICS */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>{t.activeEmployees}</Text>
          <View style={styles.metricValueContainer}>
            <Text style={styles.metricValue}>{stats?.activeUsers || 0}</Text>
          </View>
          <Text style={styles.metricSubtitle}>{t.readyToWork}</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>{t.totalJobs}</Text>
          <View style={styles.metricValueContainer}>
            <Text style={styles.metricValue}>{stats?.totalJobs || 0}</Text>
          </View>
          <Text style={styles.metricSubtitle}>{t.activeOpenings}</Text>
        </View>
      </View>

      {/* 5. TODAY'S SCHEDULE SECTION */}
      <View style={styles.scheduleSection}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{t.todaySchedule}</Text>
          <Text style={styles.dateLabel}>{new Date().toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}</Text>
        </View>

        <View style={styles.scheduleList}>
          {todaySchedules.length > 0 ? (
            todaySchedules.map((sch: any) => (
              <View key={sch.id} style={styles.scheduleItem}>
                <View style={styles.timeWrapper}>
                  <Text style={styles.timeText}>{sch.start_time}</Text>
                  <Text style={styles.timeSubText}>{sch.end_time}</Text>
                </View>
                <View style={styles.scheduleContent}>
                  <Text style={styles.scheduleTitleText}>{sch.title}</Text>
                  {sch.description ? <Text style={styles.scheduleDescText}>{sch.description}</Text> : null}
                  <Text style={styles.scheduleAssignedText}>{t.for}: {sch.user_name || 'Semua'}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.taskListEmpty}>
              <Ionicons name="calendar-outline" size={32} color="#d1d5db" />
              <Text style={styles.emptyText}>{t.noSchedules}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 6. MY TASK SECTION */}
      <View style={styles.taskSection}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{t.myTasks}</Text>
          <TouchableOpacity onPress={() => router.push('/tasks')}>
            <Text style={styles.viewMoreBtn}>{t.manageTasks}</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Selection */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'Today' && styles.tabItemActive]}
            onPress={() => setActiveTab('Today')}
          >
            <Text style={[styles.tabLabel, activeTab === 'Today' && styles.tabLabelActive]}>{t.running} ({pendingTasks.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'Completed' && styles.tabItemActive]}
            onPress={() => setActiveTab('Completed')}
          >
            <Text style={[styles.tabLabel, activeTab === 'Completed' && styles.tabLabelActive]}>{t.completed} ({completedTasks.length})</Text>
          </TouchableOpacity>
        </View>

        {/* Task Checklist Items */}
        {activeTab === 'Today' ? (
          <View style={styles.taskList}>
            {pendingTasks.length > 0 ? (
              pendingTasks.map((t: any) => (
                <View key={t.id} style={styles.taskItem}>
                  <View style={[styles.checkbox, t.status === 'In Progress' && styles.checkboxProgress]}>
                    {t.status === 'In Progress' ? (
                      <Ionicons name="time" size={12} color="#ffffff" />
                    ) : (
                      <View style={styles.checkboxInner} />
                    )}
                  </View>
                  <View style={styles.taskContent}>
                    <Text style={styles.taskText}>{t.task_name}</Text>
                    <Text style={styles.taskTime}>
                      {t.task_date ? new Date(t.task_date).toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' }) : ''}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.taskListEmpty}>
                <Ionicons name="checkmark-done-circle" size={32} color="#d1d5db" />
                <Text style={styles.emptyText}>{t.noRunningTasks}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.taskList}>
            {completedTasks.length > 0 ? (
              completedTasks.map((t: any) => (
                <View key={t.id} style={styles.taskItem}>
                  <View style={styles.checkboxActive}>
                    <Ionicons name="checkmark" size={12} color="#ffffff" />
                  </View>
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskText, { textDecorationLine: 'line-through', color: '#9ca3af' }]}>{t.task_name}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.taskListEmpty}>
                <Ionicons name="checkmark-done-circle" size={32} color="#d1d5db" />
                <Text style={styles.emptyText}>{t.noCompletedTasks}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* 7. NOTICEBOARD SECTION */}
      <View style={styles.noticeSection}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{t.noticeboard}</Text>
          <Ionicons name="megaphone-outline" size={16} color="#7b3fe4" />
        </View>
        <View style={styles.noticeList}>
          {notices.length > 0 ? (
            notices.map((n: any) => (
              <View key={n.id} style={styles.noticeItem}>
                <View style={styles.noticeMeta}>
                  <Text style={styles.noticeSubject}>{n.subject}</Text>
                  <View style={[styles.priorityBadge, n.priority === 'High' ? styles.priorityHigh : n.priority === 'Medium' ? styles.priorityMedium : styles.priorityLow]}>
                    <Text style={styles.priorityText}>{n.priority}</Text>
                  </View>
                </View>
                {n.description ? <Text style={styles.noticeDesc}>{n.description}</Text> : null}
                <View style={styles.noticeFooter}>
                  <Text style={styles.noticeDate}>
                    {new Date(n.start_date).toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })} - {new Date(n.end_date).toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}
                  </Text>
                  <Text style={styles.noticeAudience}>{t.for}: {n.audience}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.taskListEmpty}>
              <Ionicons name="megaphone-outline" size={32} color="#d1d5db" />
              <Text style={styles.emptyText}>{t.noNotices}</Text>
            </View>
          )}
        </View>
      </View>

      {/* LOGOUT ACTION */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#ef4444" />
        <Text style={styles.logoutText}>{t.logoutBtn}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fbfd',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fbfd',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7b3fe4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7b3fe4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  nameContainer: {
    marginLeft: 12,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e2022',
  },
  roleText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
    fontWeight: '600',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f3f7',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  // Menu Grid
  menuGridContainer: {
    marginBottom: 25,
  },
  menuGridTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 15,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    rowGap: 16,
  },
  menuItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  menuItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  // Chart Card
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e2022',
  },
  badge: {
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#7b3fe4',
  },
  streamContainer: {
    gap: 14,
  },
  streamItem: {
    gap: 6,
  },
  streamMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streamName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563',
  },
  streamValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1f2937',
  },
  streamTrack: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  streamFill: {
    height: 8,
    borderRadius: 4,
  },
  // Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  metricTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f2937',
  },
  metricSubtitle: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '600',
  },
  // Schedule Section
  scheduleSection: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 20,
  },
  scheduleList: {
    gap: 12,
    marginTop: 15,
  },
  scheduleItem: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  timeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    paddingRight: 10,
    width: 60,
  },
  timeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#7b3fe4',
  },
  timeSubText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 2,
  },
  scheduleContent: {
    flex: 1,
    justifyContent: 'center',
  },
  scheduleTitleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scheduleDescText: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  scheduleAssignedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9ca3af',
    marginTop: 4,
  },
  // Tasks Section
  taskSection: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 20,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e2022',
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#7b3fe4',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  viewMoreBtn: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#7b3fe4',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    padding: 3,
    marginVertical: 15,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 11,
  },
  tabItemActive: {
    backgroundColor: '#ffffff',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#9ca3af',
  },
  tabLabelActive: {
    color: '#1f2937',
  },
  taskList: {
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 16,
    padding: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxProgress: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  checkboxActive: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: {
    marginLeft: 12,
    flex: 1,
  },
  taskText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  taskTime: {
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: '600',
    marginTop: 2,
  },
  taskListEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
  // Notice Section
  noticeSection: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 20,
  },
  noticeList: {
    gap: 12,
    marginTop: 15,
  },
  noticeItem: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  noticeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  noticeSubject: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityHigh: {
    backgroundColor: '#fef2f2',
  },
  priorityMedium: {
    backgroundColor: '#eff6ff',
  },
  priorityLow: {
    backgroundColor: '#fef3c7',
  },
  priorityText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  noticeDesc: {
    fontSize: 11,
    color: '#4b5563',
    lineHeight: 16,
  },
  noticeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f7',
    paddingTop: 8,
    marginTop: 4,
  },
  noticeDate: {
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: '600',
  },
  noticeAudience: {
    fontSize: 9,
    color: '#7b3fe4',
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#fee2e2',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 6,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
