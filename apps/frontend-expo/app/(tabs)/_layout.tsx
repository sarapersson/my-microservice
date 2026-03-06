/**
 * Tab layout — defines the bottom tab navigation for the app.
 * Two tabs:
 *   - Home (index.tsx)    — the main demo screen with login/info/health
 *   - Explore (explore.tsx) — documentation about the project
 *
 * Uses expo-router's file-based routing: each file in (tabs)/ becomes a tab.
 */

import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,  // Highlight color for active tab
        headerShown: false,                                          // Hide the top header bar
        tabBarButton: HapticTab,                                     // Use haptic feedback on iOS
      }}>
      {/* Home tab — main demo screen */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      {/* Explore tab — project documentation */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
