import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';

// Determine API URL based on environment
// Default production cloud backend on Vercel:
const DEFAULT_CLOUD_API = 'https://hrms-cbn.vercel.app/api';
const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
const debuggerHost = Constants.expoConfig?.hostUri;

// If running in local Expo Go dev mode, use laptop IP. Otherwise use Cloud Vercel backend:
let API_URL = envApiUrl || DEFAULT_CLOUD_API;

if (!envApiUrl && debuggerHost) {
  API_URL = `http://${debuggerHost.split(':')[0]}:8000/api`;
}

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Update last active time to reset inactivity timer
    await AsyncStorage.setItem('lastActiveTime', Date.now().toString());
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 (Unauthorized) errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      await AsyncStorage.multiRemove(['token', 'role', 'name', 'lastActiveTime']);
      router.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
