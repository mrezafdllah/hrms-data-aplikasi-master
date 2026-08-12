import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AlertType = 'success' | 'error' | 'warning' | 'confirm' | 'delete' | 'info';

interface CustomAlertProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const getTheme = (type: AlertType) => {
  switch (type) {
    case 'success':
      return {
        icon: 'checkmark-circle' as const,
        iconColor: '#10b981',
        iconBg: '#ecfdf5',
        accentColor: '#10b981',
        btnGradient: ['#10b981', '#059669'],
      };
    case 'error':
      return {
        icon: 'close-circle' as const,
        iconColor: '#ef4444',
        iconBg: '#fef2f2',
        accentColor: '#ef4444',
        btnGradient: ['#ef4444', '#dc2626'],
      };
    case 'warning':
      return {
        icon: 'alert-circle' as const,
        iconColor: '#f59e0b',
        iconBg: '#fffbeb',
        accentColor: '#f59e0b',
        btnGradient: ['#f59e0b', '#d97706'],
      };
    case 'delete':
      return {
        icon: 'trash' as const,
        iconColor: '#ef4444',
        iconBg: '#fef2f2',
        accentColor: '#ef4444',
        btnGradient: ['#ef4444', '#dc2626'],
      };
    case 'confirm':
      return {
        icon: 'help-circle' as const,
        iconColor: '#7b3fe4',
        iconBg: '#f5f3ff',
        accentColor: '#7b3fe4',
        btnGradient: ['#7b3fe4', '#6930d0'],
      };
    case 'info':
    default:
      return {
        icon: 'information-circle' as const,
        iconColor: '#3b82f6',
        iconBg: '#eff6ff',
        accentColor: '#3b82f6',
        btnGradient: ['#3b82f6', '#2563eb'],
      };
  }
};

export default function CustomAlert({
  visible,
  type = 'info',
  title,
  message,
  onClose,
  onConfirm,
  confirmText,
  cancelText,
}: CustomAlertProps) {
  const theme = getTheme(type);
  const hasConfirm = !!onConfirm;
  const displayConfirmText = confirmText || (type === 'delete' ? 'Hapus' : 'Ya, Lanjutkan');
  const displayCancelText = cancelText || 'Batal';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: theme.iconBg }]}>
            <Ionicons name={theme.icon} size={32} color={theme.iconColor} />
          </View>

          {/* Text */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={hasConfirm ? styles.buttonRow : styles.buttonSingle}>
            {hasConfirm && (
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>{displayCancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                hasConfirm ? styles.confirmBtn : styles.singleBtn,
                { backgroundColor: theme.accentColor },
              ]}
              onPress={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmText}>
                {hasConfirm ? displayConfirmText : 'OK'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e2022',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 19,
    fontWeight: '500',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  buttonSingle: {
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#7b3fe4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  singleBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
