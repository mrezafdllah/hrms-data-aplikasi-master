import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('role').then((r) => setRole(r));
  }, []);

  const isEmployee = role === 'Karyawan';

  return (
    <Tabs 
      screenOptions={{ 
        headerShown: true, 
        tabBarActiveTintColor: '#f97316', // CBN Orange brand theme matching logo
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f3f7',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f3f7',
        },
        headerTitleStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#1e2022',
        }
      }}
    >
      {/* 1. Dashboard Tab (Visible) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerShown: false, // Custom header inside dashboard
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
          ),
        }}
      />

      {/* 2. Users Tab (Visible) */}
      <Tabs.Screen
        name="users"
        options={{
          title: isEmployee ? 'Rekan Kerja' : 'Karyawan',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} />
          ),
        }}
      />

      {/* 4. Profile Tab (Visible) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />

      {/* Hidden Screens (Accessed via Dashboard buttons) */}
      <Tabs.Screen
        name="roles"
        options={{
          title: 'Peran (Roles)',
          headerShown: false,
          href: null,
        }}
      />
      <Tabs.Screen
        name="companies"
        options={{
          title: 'Perusahaan',
          headerShown: false,
          href: null,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Divisi',
          headerShown: false,
          href: null,
        }}
      />
      <Tabs.Screen
        name="positions"
        options={{
          title: 'Jabatan',
          headerShown: false,
          href: null,
        }}
      />

    </Tabs>
  );
}
