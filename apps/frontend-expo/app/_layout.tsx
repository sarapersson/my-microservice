/**
 * Root layout for the Expo app.
 * This wraps the entire application with:
 *   - ThemeProvider: enables dark/light mode theming
 *   - Stack navigator: manages screen navigation (tabs + modal)
 *   - StatusBar: controls the device status bar style
 *
 * The "anchor" setting tells expo-router that the (tabs) group is the
 * default/home screen when the app starts.
 */

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

// Tell expo-router that (tabs) is the starting screen
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  // Detect if the user prefers dark or light mode
  const colorScheme = useColorScheme();

  return (
    // Apply the matching theme (dark or light) to all child screens
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Main tab-based screens (Home + Explore) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Modal screen that slides up from the bottom */}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
