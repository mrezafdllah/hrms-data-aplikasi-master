import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api from '../utils/api';

export default function LoginScreen() {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
    // SCREEN 1: ONBOARDING SCREEN (Left Phone in mockup)
    return (
      <View style={styles.onboardingContainer}>
        {/* Skip button top right */}
        <TouchableOpacity style={styles.skipButton} onPress={() => setShowForm(true)}>
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>

        {/* Giant Logo */}
        <View style={styles.giantLogoContainer}>
          <View style={styles.slashGroup}>
            {/* Dark slash */}
            <View style={[styles.slash, styles.darkSlash, { transform: [{ rotate: '-30deg' }] }]} />
            {/* Green slash */}
            <View style={[styles.slash, styles.greenSlash, { transform: [{ rotate: '-30deg' }] }]} />
          </View>
        </View>

        {/* Headline */}
        <View style={styles.onboardingContent}>
          <Text style={styles.headlineText}>Create {'\n'}your best {'\n'}employees</Text>
          <Text style={styles.subHeadlineText}>Digital HRMS - PT Cybers Blitz Nusantara</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.onboardingFooter}>
          <TouchableOpacity style={styles.getStartedButton} onPress={() => setShowForm(true)}>
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signInLink} onPress={() => setShowForm(true)}>
            <Text style={styles.signInLabel}>
              Already have an account? <Text style={styles.signInGreen}>Sign in</Text>
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
          <View style={styles.smallSlashGroup}>
            <View style={[styles.smallSlash, styles.darkSlash, { transform: [{ rotate: '-30deg' }] }]} />
            <View style={[styles.smallSlash, styles.greenSlash, { transform: [{ rotate: '-30deg' }] }]} />
          </View>
          <Text style={styles.logoText}>Workwave</Text>
        </View>

        {/* Header */}
        <View style={styles.formHeader}>
          <Text style={styles.welcomeText}>Welcome Back !</Text>
          <Text style={styles.welcomeSubtext}>Please enter your details to sign in</Text>
        </View>

        {/* Error Display */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Form Inputs */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="example@hr.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
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

        {/* Terms text */}
        <Text style={styles.termsText}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
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
    backgroundColor: '#3a6bf6',
  },
  greenSlash: {
    backgroundColor: '#7b3fe4',
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
    backgroundColor: '#7b3fe4',
    paddingVertical: 18,
    borderRadius: 9999,
    alignItems: 'center',
    shadowColor: '#7b3fe4',
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
    color: '#7b3fe4',
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
    backgroundColor: '#7b3fe4',
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#7b3fe4',
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
