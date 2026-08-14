import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

export default function LoginScreen() {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureEntry, setSecureEntry] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  React.useEffect(() => {
    const loadRememberedEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('remembered_email');
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      } catch (e) {}
    };
    loadRememberedEmail();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Harap isi email dan password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/login', { email, password });
      if (response.data && response.data.access_token) {
        if (rememberMe) {
          await AsyncStorage.setItem('remembered_email', email);
        } else {
          await AsyncStorage.removeItem('remembered_email');
        }
        await AsyncStorage.setItem('token', response.data.access_token);
        await AsyncStorage.setItem('role', response.data.role);
        await AsyncStorage.setItem('name', response.data.name);
        await AsyncStorage.setItem('employee_id', response.data.user_id.toString());
        
        router.replace('/');
      } else {
        setError('Respons server tidak valid.');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Terjadi kesalahan. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    // SCREEN 1: ONBOARDING SCREEN
    return (
      <View style={styles.onboardingContainer}>
        {/* Skip button top right */}
        <TouchableOpacity style={styles.skipButton} onPress={() => setShowForm(true)}>
          <Text style={styles.skipText}>LEWATI</Text>
        </TouchableOpacity>

        {/* Giant Logo */}
        <View style={styles.giantLogoContainer}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={{ width: 120, height: 120, resizeMode: 'contain' }} 
          />
        </View>

        {/* Headline */}
        <View style={styles.onboardingContent}>
          <Text style={styles.headlineText}>Kelola SDM {'\n'}Terbaik Anda {'\n'}Sekarang</Text>
          <Text style={styles.subHeadlineText}>Digital HRMS - PT Cybers Blitz Nusantara</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.onboardingFooter}>
          <TouchableOpacity style={styles.getStartedButton} onPress={() => setShowForm(true)}>
            <Text style={styles.getStartedText}>Mulai Sekarang</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signInLink} onPress={() => setShowForm(true)}>
            <Text style={styles.signInLabel}>
              Sudah memiliki akun? <Text style={styles.signInGreen}>Masuk</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // SCREEN 2: LOGIN FORM SCREEN
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => setShowForm(false)}>
          <Text style={styles.backButtonText}>← Kembali</Text>
        </TouchableOpacity>

        {/* Small Logo */}
        <View style={styles.smallLogoContainer}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={{ width: 36, height: 36, resizeMode: 'contain', marginRight: 8 }} 
          />
          <Text style={styles.logoText}>CBN HRMS</Text>
        </View>

        {/* Header */}
        <View style={styles.formHeader}>
          <Text style={styles.welcomeText}>Selamat Datang Kembali!</Text>
          <Text style={styles.welcomeSubtext}>Silakan masukkan kredensial akun Anda</Text>
        </View>

        {/* Error Display */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Form Inputs */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="contoh@email.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Kata Sandi</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry={secureEntry}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity 
              style={styles.eyeButton} 
              onPress={() => setSecureEntry(!secureEntry)}
            >
              <Ionicons 
                name={secureEntry ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#6b7280" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Remember Me & Forgot Password Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} 
            onPress={() => setRememberMe(!rememberMe)}
          >
            <Ionicons 
              name={rememberMe ? "checkbox" : "square-outline"} 
              size={20} 
              color={rememberMe ? "#f97316" : "#9ca3af"} 
            />
            <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '600' }}>Ingat Saya</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              setForgotEmail(email);
              setForgotSuccessMsg('');
              setShowForgotModal(true);
            }}
          >
            <Text style={{ fontSize: 12, color: '#f97316', fontWeight: '600' }}>Lupa Kata Sandi?</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Masuk →</Text>
          )}
        </TouchableOpacity>

        {/* Modal Lupa Kata Sandi */}
        <Modal visible={showForgotModal} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e2022', marginBottom: 8 }}>Lupa Kata Sandi?</Text>
              <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, lineHeight: 18 }}>
                Untuk alasan keamanan data perusahaan, pemulihan kata sandi dilakukan melalui verifikasi Admin HR perusahaan Anda. Silakan masukkan alamat email akun Anda.
              </Text>

              {forgotSuccessMsg ? (
                <View style={{ backgroundColor: '#ecfdf5', padding: 12, borderRadius: 12, marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, color: '#047857', fontWeight: '600', lineHeight: 18 }}>{forgotSuccessMsg}</Text>
                </View>
              ) : (
                <View style={{ gap: 12, marginBottom: 16 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase' }}>Email Terdaftar</Text>
                  <TextInput
                    style={{ borderBottomWidth: 1, borderColor: '#e5e7eb', paddingVertical: 8, fontSize: 14, color: '#1e2022' }}
                    placeholder="Masukkan email Anda"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                  />
                  <TouchableOpacity
                    style={{ backgroundColor: '#f97316', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 }}
                    onPress={() => {
                      if (forgotEmail) {
                        setForgotSuccessMsg(`Instruksi reset password telah dikirim ke Admin HR perusahaan Anda untuk email "${forgotEmail}". Silakan hubungi Admin HR perusahaan Anda.`);
                      }
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Kirim Permintaan Reset</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}
                onPress={() => setShowForgotModal(false)}
              >
                <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 12 }}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Terms text */}
        <Text style={styles.termsText}>
          Dengan masuk, Anda menyetujui Syarat Layanan dan Kebijakan Privasi kami.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ONBOARDING
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  skipButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  giantLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  slashGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    width: 200,
  },
  slash: {
    width: 45,
    height: 140,
    borderRadius: 22,
    marginHorizontal: 10,
  },
  darkSlash: {
    backgroundColor: '#f97316',
  },
  greenSlash: {
    backgroundColor: '#f59e0b',
  },
  onboardingContent: {
    marginTop: 20,
  },
  headlineText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#1e2022',
    lineHeight: 48,
    letterSpacing: -1,
  },
  subHeadlineText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
    marginTop: 10,
  },
  onboardingFooter: {
    marginTop: 40,
    gap: 15,
  },
  getStartedButton: {
    backgroundColor: '#f97316',
    paddingVertical: 18,
    borderRadius: 9999,
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  getStartedText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  signInLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  signInGreen: {
    color: '#f97316',
    fontWeight: 'bold',
  },

  // LOGIN FORM
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 50,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginBottom: 30,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  smallLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  smallSlashGroup: {
    flexDirection: 'row',
    height: 30,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  smallSlash: {
    width: 8,
    height: 25,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e2022',
  },
  formHeader: {
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e2022',
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 5,
  },
  formGroup: {
    marginBottom: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1f2937',
  },
  eyeButton: {
    paddingLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1f2937',
  },
  loginButton: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
    fontWeight: '600',
    fontSize: 13,
  },
  termsText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 30,
    lineHeight: 16,
  },
});
