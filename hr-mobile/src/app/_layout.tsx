import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, AppState, AppStateStatus } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments, Stack } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const lastActive = await AsyncStorage.getItem('lastActiveTime');
        const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

        if (token && lastActive) {
          const timeDiff = Date.now() - parseInt(lastActive, 10);
          if (timeDiff > INACTIVITY_LIMIT) {
            // Session expired due to inactivity
            await AsyncStorage.multiRemove(['token', 'role', 'name', 'lastActiveTime']);
            setIsAuthenticated(false);
            router.replace('/login');
            return;
          }
        }

        setIsAuthenticated(!!token);
        if (token) {
          await AsyncStorage.setItem('lastActiveTime', Date.now().toString());
        }
      } catch (e) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [segments]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const token = await AsyncStorage.getItem('token');
        const lastActive = await AsyncStorage.getItem('lastActiveTime');
        const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

        if (token && lastActive) {
          const timeDiff = Date.now() - parseInt(lastActive, 10);
          if (timeDiff > INACTIVITY_LIMIT) {
            // Session expired while app was in background
            await AsyncStorage.multiRemove(['token', 'role', 'name', 'lastActiveTime']);
            setIsAuthenticated(false);
            router.replace('/login');
            return;
          }
        }
        if (token) {
          await AsyncStorage.setItem('lastActiveTime', Date.now().toString());
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          await AsyncStorage.setItem('lastActiveTime', Date.now().toString());
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated === null) return;

    const inAuthGroup = segments[0] === 'login';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect away from login if authenticated
      router.replace('/');
    }
  }, [isAuthenticated, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
