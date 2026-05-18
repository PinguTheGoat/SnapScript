import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

import AppNavigator from './navigation/AppNavigator';
import { AppContext } from './utils/appContext';
import { ThemeContext, themes } from './utils/theme';

const HISTORY_KEY = 'snapscript.history.v2';
const SETTINGS_KEY = 'snapscript.settings.v2';

const defaultSettings = {
  ocrMode: 'auto',
  notificationsEnabled: false,
  handwritingEnhancement: true,
  imageEnhancement: 'High',
  themeMode: 'system',
};

export default function App() {
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [hydrated, setHydrated] = useState(false);

  const systemScheme = useColorScheme();
  const resolvedScheme = settings.themeMode === 'system' ? systemScheme : settings.themeMode;
  const theme = themes[resolvedScheme === 'dark' ? 'dark' : 'light'];

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      try {
        const [savedHistory, savedSettings] = await Promise.all([
          AsyncStorage.getItem(HISTORY_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);

        if (!active) {
          return;
        }

        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory);
          setHistory(Array.isArray(parsedHistory) ? parsedHistory.sort((left, right) => Number(right.timestamp || 0) - Number(left.timestamp || 0)) : []);
        }

        if (savedSettings) {
          setSettings(normalizeSettings(JSON.parse(savedSettings)));
        }
      } catch (error) {
        console.warn('Failed to hydrate SnapScript state', error);
      } finally {
        if (active) {
          setHydrated(true);
        }
      }
    };

    hydrate();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history)).catch((error) => {
      console.warn('Failed to persist history', error);
    });
  }, [history, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch((error) => {
      console.warn('Failed to persist settings', error);
    });
  }, [settings, hydrated]);

  const saveScanResult = useCallback((scan) => {
    const timestamp = Number(scan.timestamp || Date.now());
    const entry = {
      ...scan,
      id: scan.id || `${timestamp}`,
      timestamp,
    };

    setHistory((currentHistory) => [entry, ...currentHistory.filter((item) => item.id !== entry.id)]);
    return entry;
  }, []);

  const updateSettings = useCallback((partialSettings) => {
    setSettings((currentSettings) => ({ ...currentSettings, ...partialSettings }));
  }, []);

  const resetAllData = useCallback(async () => {
    setHistory([]);
    setSettings(defaultSettings);
    await AsyncStorage.multiRemove([HISTORY_KEY, SETTINGS_KEY]);
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      history,
      settings,
      saveScanResult,
      updateSettings,
      resetAllData,
    }),
    [hydrated, history, resetAllData, saveScanResult, settings, updateSettings],
  );

  return (
    <ThemeContext.Provider value={theme}>
      <AppContext.Provider value={value}>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.BACKGROUND }}>
          <SafeAreaProvider>
            <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} backgroundColor={theme.BACKGROUND} />
            <AppNavigator />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </AppContext.Provider>
    </ThemeContext.Provider>
  );
}

function normalizeSettings(savedSettings) {
  const legacyTheme = String(savedSettings?.theme || '').toLowerCase();
  const themeMode = ['light', 'dark', 'system'].includes(savedSettings?.themeMode)
    ? savedSettings.themeMode
    : (legacyTheme === 'dark' || legacyTheme === 'light' ? legacyTheme : 'system');

  const ocrMode = ['auto', 'handwritten', 'printed'].includes(savedSettings?.ocrMode)
    ? savedSettings.ocrMode
    : 'auto';

  return {
    ...defaultSettings,
    ...savedSettings,
    themeMode,
    ocrMode,
    notificationsEnabled: Boolean(savedSettings?.notificationsEnabled),
    handwritingEnhancement: savedSettings?.handwritingEnhancement ?? true,
    imageEnhancement: savedSettings?.imageEnhancement || defaultSettings.imageEnhancement,
  };
}
