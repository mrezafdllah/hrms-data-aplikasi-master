import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Auto-detect development server IP for Expo Go
const debuggerHost = Constants.expoConfig?.hostUri;
let API_URL = 'http://localhost:8000/api';

if (debuggerHost) {
  API_URL = `http://${debuggerHost.split(':')[0]}:8000/api`;
} else if (Platform.OS === 'android') {
  API_URL = 'http://10.0.2.2:8000/api';
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
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
