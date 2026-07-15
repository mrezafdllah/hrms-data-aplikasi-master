import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal, Platform, KeyboardAvoidingView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

const STATUS_COLORS: Record<string, string> = {
  'Pending': '#f59e0b',
  'In Progress': '#3b82f6',
  'Completed': '#10b981',
};

const STATUS_BG: Record<string, string> = {
  'Pending': '#fffbeb',
  'In Progress': '#eff6ff',
  'Completed': '#ecfdf5',
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
    visualTitle: "Progress Tugas",
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
    chooseEmployee: "Pilih Karyawan",
    edit: "Edit",
    delete: "Hapus",
    loading: "Memuat Tugas...",
    confirmDelete: "Apakah Anda yakin ingin menghapus tugas ini?",
    confirmTitle: "Hapus Tugas",
    statusSelection: "Pilih Status",
    overallProgress: "Progress Keseluruhan",
    tasksCompleted: "tugas selesai",
    validation: "Validasi",
    taskNameRequired: "Nama tugas harus diisi",
    selectEmployeeFirst: "Pilih karyawan terlebih dahulu",
    failedSave: "Gagal menyimpan tugas",
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
    visualTitle: "Task Progress",
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
    chooseEmployee: "Choose Employee",
    edit: "Edit",
    delete: "Delete",
    loading: "Loading Tasks...",
    confirmDelete: "Are you sure you want to delete this task?",
    confirmTitle: "Delete Task",
    statusSelection: "Select Status",
    overallProgress: "Overall Progress",
    tasksCompleted: "tasks completed",
    validation: "Validation",
    taskNameRequired: "Task name is required",
    selectEmployeeFirst: "Please select an employee first",
    failedSave: "Failed to save task",
  }
};

export default function TasksScreen() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState<number | null>(null);
  const [language, setLanguage] = useState<'ID' | 'EN'>('ID');

  const [formData, setFormData] = useState({
    user_id: '',
    task_name: '',
    description: '',
    task_date: new Date().toISOString().split('T')[0],
    status: 'Pending',
  });

  const isKaryawan = role === 'Karyawan';
  const t = translations[language];

  const loadLang = useCallback(async () => {
    const lang = await AsyncStorage.getItem('language');
    if (lang === 'EN') setLanguage('EN');
    else setLanguage('ID');
  }, []);

  const fetchRole = useCallback(async () => {
    const storedRole = await AsyncStorage.getItem('role');
    if (storedRole) setRole(storedRole);
  }, []);

  const fetchTasks = useCallback(() => {
    setLoading(true);
    api.get('/tasks')
      .then(res => {
        if (res.data?.status === 'Success') setTasks(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch tasks error:', err);
        setLoading(false);
      });
  }, []);

  const fetchUsers = useCallback(() => {
    api.get('/users')
      .then(res => {
        if (res.data?.status === 'Success') setUsers(res.data.data);
      })
      .catch(err => console.error('Fetch users error:', err));
  }, []);

  useEffect(() => {
    loadLang();
    fetchRole();
    fetchTasks();
  }, [loadLang, fetchRole, fetchTasks]);

  useEffect(() => {
    if (!isKaryawan && role) fetchUsers();
  }, [role, isKaryawan, fetchUsers]);

  const pendingCount = tasks.filter(t => t.status === 'Pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;

  const openAddModal = () => {
    setFormData({
      user_id: '',
      task_name: '',
      description: '',
      task_date: new Date().toISOString().split('T')[0],
      status: 'Pending',
    });
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (task: any) => {
    setFormData({
      user_id: String(task.user_id || ''),
      task_name: task.task_name,
      description: task.description || '',
      task_date: task.task_date ? task.task_date.split('T')[0] : new Date().toISOString().split('T')[0],
      status: task.status,
    });
    setEditingId(task.id);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert(t.confirmTitle, t.confirmDelete, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: () => {
          api.delete(`/tasks/${id}`)
            .then(res => {
              if (res.data?.status === 'Success') fetchTasks();
            })
            .catch(err => Alert.alert('Error', 'Gagal menghapus tugas'));
        }
      }
    ]);
  };

  const handleStatusChange = (taskId: number, newStatus: string) => {
    api.put(`/tasks/${taskId}`, { status: newStatus })
      .then(res => {
        if (res.data?.status === 'Success') {
          fetchTasks();
          setShowStatusPicker(null);
        }
      })
      .catch(err => Alert.alert('Error', 'Gagal mengubah status'));
  };

  const handleSubmit = () => {
    if (!formData.task_name.trim()) {
      Alert.alert(t.validation, t.taskNameRequired);
      return;
    }
    if (!formData.user_id) {
      Alert.alert(t.validation, t.selectEmployeeFirst);
      return;
    }

    const url = editingId ? `/tasks/${editingId}` : '/tasks';
    const method = editingId ? 'put' : 'post';
    const payload = {
      ...formData,
      user_id: parseInt(formData.user_id),
    };

    api[method](url, payload)
      .then(res => {
        if (res.data?.status === 'Success') {
          setShowModal(false);
          setEditingId(null);
          fetchTasks();
        } else {
          Alert.alert('Gagal', res.data?.detail || t.failedSave);
        }
      })
      .catch(err => Alert.alert('Error', err.response?.data?.detail || 'Terjadi kesalahan'));
  };

  const getSelectedUserName = () => {
    const user = users.find(u => String(u.id) === formData.user_id);
    return user ? user.full_name : t.chooseEmployee;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7b3fe4" />
        <Text style={styles.loadingText}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>
              {isKaryawan ? t.subtitleKaryawan : t.subtitleAdmin}
            </Text>
          </View>
          {!isKaryawan && (
            <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addBtnText}>{t.addTask}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: STATUS_BG['Pending'], borderColor: '#fde68a' }]}>
            <Ionicons name="alert-circle-outline" size={18} color={STATUS_COLORS['Pending']} />
            <Text style={[styles.statNumber, { color: STATUS_COLORS['Pending'] }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>{t.pending}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: STATUS_BG['In Progress'], borderColor: '#bfdbfe' }]}>
            <Ionicons name="time-outline" size={18} color={STATUS_COLORS['In Progress']} />
            <Text style={[styles.statNumber, { color: STATUS_COLORS['In Progress'] }]}>{inProgressCount}</Text>
            <Text style={styles.statLabel}>{t.inProgress}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: STATUS_BG['Completed'], borderColor: '#a7f3d0' }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color={STATUS_COLORS['Completed']} />
            <Text style={[styles.statNumber, { color: STATUS_COLORS['Completed'] }]}>{completedCount}</Text>
            <Text style={styles.statLabel}>{t.completed}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        {tasks.length > 0 && (
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>{t.overallProgress}</Text>
            <View style={styles.progressBarBg}>
              {completedCount > 0 && (
                <View style={[styles.progressBarFill, { width: `${(completedCount / tasks.length) * 100}%`, backgroundColor: STATUS_COLORS['Completed'] }]} />
              )}
              {inProgressCount > 0 && (
                <View style={[styles.progressBarFill, { width: `${(inProgressCount / tasks.length) * 100}%`, backgroundColor: STATUS_COLORS['In Progress'] }]} />
              )}
              {pendingCount > 0 && (
                <View style={[styles.progressBarFill, { width: `${(pendingCount / tasks.length) * 100}%`, backgroundColor: STATUS_COLORS['Pending'] }]} />
              )}
            </View>
            <Text style={styles.progressText}>
              {completedCount}/{tasks.length} {t.tasksCompleted} ({tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%)
            </Text>
          </View>
        )}

        {/* Task List */}
        {tasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>{t.noTasks}</Text>
          </View>
        ) : (
          tasks.map(task => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <View style={[styles.taskStatusDot, { backgroundColor: STATUS_COLORS[task.status] || '#9ca3af' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskNameText}>{task.task_name}</Text>
                  {task.description ? <Text style={styles.taskDesc}>{task.description}</Text> : null}
                </View>
              </View>

              <View style={styles.taskMeta}>
                {!isKaryawan && (
                  <View style={styles.taskMetaItem}>
                    <Ionicons name="person-outline" size={12} color="#9ca3af" />
                    <Text style={styles.taskMetaText}>{task.user_name || '-'}</Text>
                  </View>
                )}
                <View style={styles.taskMetaItem}>
                  <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
                  <Text style={styles.taskMetaText}>
                    {task.task_date ? new Date(task.task_date).toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  </Text>
                </View>
              </View>

              <View style={styles.taskActions}>
                {/* Status Picker */}
                {isKaryawan ? (
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {['Pending', 'In Progress', 'Completed'].map(s => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.statusChip,
                          { backgroundColor: task.status === s ? STATUS_COLORS[s] : STATUS_BG[s], borderColor: STATUS_COLORS[s] }
                        ]}
                        onPress={() => handleStatusChange(task.id, s)}
                      >
                        <Text style={[styles.statusChipText, { color: task.status === s ? '#fff' : STATUS_COLORS[s] }]}>
                          {s === 'Completed' ? t.completed : s === 'In Progress' ? t.inProgress : t.pending}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[task.status] }]}>
                      <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[task.status] }]}>
                        {task.status === 'Completed' ? t.completed : task.status === 'In Progress' ? t.inProgress : t.pending}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity onPress={() => openEditModal(task)} style={styles.actionIcon}>
                        <Ionicons name="create-outline" size={18} color="#7b3fe4" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(task.id)} style={styles.actionIcon}>
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          ))
        )}

        {/* ====== MODAL: Add/Edit Task ====== */}
        <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingId ? t.modalEdit : t.modalAdd}</Text>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.assignedEmployee}</Text>
                  <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowUserPicker(true)}>
                    <Text style={styles.pickerBtnText}>{getSelectedUserName()}</Text>
                    <Ionicons name="chevron-down" size={16} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.taskName}</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.task_name}
                    onChangeText={txt => setFormData(prev => ({ ...prev, task_name: txt }))}
                    placeholder={t.placeholderName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.description}</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={formData.description}
                    onChangeText={txt => setFormData(prev => ({ ...prev, description: txt }))}
                    placeholder={t.placeholderDesc}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>{t.date}</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.task_date}
                      onChangeText={txt => setFormData(prev => ({ ...prev, task_date: txt }))}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>{t.status}</Text>
                    <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowStatusPicker(999)}>
                      <Text style={styles.pickerBtnText}>
                        {formData.status === 'Completed' ? t.completed : formData.status === 'In Progress' ? t.inProgress : t.pending}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                    <Ionicons name="close-outline" size={16} color="#6b7280" />
                    <Text style={styles.cancelBtnText}>{t.cancel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
                    <Ionicons name="checkmark-outline" size={16} color="#fff" />
                    <Text style={styles.saveBtnText}>{t.save}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* User Picker Modal */}
        <Modal visible={showUserPicker} transparent animationType="fade" onRequestClose={() => setShowUserPicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '60%' }]}>
              <Text style={styles.modalTitle}>{t.chooseEmployee}</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {users.map(u => (
                  <TouchableOpacity
                    key={u.id}
                    style={[styles.userOption, String(u.id) === formData.user_id && styles.userOptionSelected]}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, user_id: String(u.id) }));
                      setShowUserPicker(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.userOptionText, String(u.id) === formData.user_id && { color: '#7b3fe4' }]}>
                        {u.full_name}
                      </Text>
                      <Text style={styles.userOptionRole}>{u.role_name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowUserPicker(false)}>
                <Text style={styles.modalCancelText}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Status Picker Modal */}
        <Modal visible={showStatusPicker !== null} transparent animationType="fade" onRequestClose={() => setShowStatusPicker(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.statusSelection}</Text>
              {['Pending', 'In Progress', 'Completed'].map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.userOption, formData.status === s && styles.userOptionSelected]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, status: s }));
                    setShowStatusPicker(null);
                  }}
                >
                  <Text style={[styles.userOptionText, formData.status === s && { color: '#7b3fe4' }]}>
                    {s === 'Completed' ? t.completed : s === 'In Progress' ? t.inProgress : t.pending}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowStatusPicker(null)}>
                <Text style={styles.modalCancelText}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e2022',
  },
  subtitle: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7b3fe4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 20,
    gap: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e2022',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
  },
  progressText: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '600',
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 14,
    gap: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  taskStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  taskNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  taskDesc: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 16,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
    paddingBottom: 10,
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskMetaText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionIcon: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e2022',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 12,
  },
  formContainer: {
    gap: 14,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  textArea: {
    minHeight: 70,
  },
  pickerBtn: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 14,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7b3fe4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  modalCancelBtn: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
  },
  userOption: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userOptionSelected: {
    backgroundColor: '#f5f3ff',
    borderRadius: 10,
  },
  userOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  userOptionRole: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 2,
  },
});
