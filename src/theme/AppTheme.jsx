import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useColorScheme } from '~/components/useColorScheme';
import { pageBackground, pageBackgroundDark } from '~/utils/constants';


const THEME_STORAGE_KEY = 'devlomatix.theme-mode';







const AppThemeContext = createContext(null);

export function AppThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(systemScheme === 'dark' ? 'dark' : 'light');
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    async function hydrateTheme() {
      try {
        const storedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (storedMode === 'light' || storedMode === 'dark') {
          setThemeMode(storedMode);
        }
      } finally {
        setIsThemeReady(true);
      }
    }

    hydrateTheme();
  }, []);

  useEffect(() => {
    if (!isThemeReady) {
      return;
    }

    AsyncStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [isThemeReady, themeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      setThemeMode,
      isThemeReady
    }),
    [isThemeReady, themeMode]
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppThemeMode() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error('useAppThemeMode must be used within AppThemeProvider');
  }

  return context;
}

export function useAppTheme() {
  const { themeMode, setThemeMode, isThemeReady } = useAppThemeMode();
  const isDark = themeMode === 'dark';

  const palette = useMemo(
    () =>
    isDark ?
    {
      mode: 'dark',
      statusBar: 'light',
      navigation: 'dark',
      page: 'bg-slate-950',
      pageBackground: pageBackgroundDark,
      pageAlt: 'bg-slate-900',
      surface: 'bg-slate-900',
      surfaceAlt: 'bg-slate-800',
      surfaceMuted: 'bg-slate-800',
      surfaceInset: 'bg-slate-800',
      text: 'text-slate-50',
      textMuted: 'text-slate-400',
      textSoft: 'text-slate-300',
      border: 'border-slate-700',
      shadow: 'shadow-black/30',
      iconCard: 'bg-amber-500/20',
      accentText: 'text-teal-300',
      accentSoft: 'bg-teal-500/15',
      amberSoft: 'bg-amber-500/15',
      skySoft: 'bg-sky-500/15',
      successSoft: 'bg-emerald-500/15',
      dangerSoft: 'bg-rose-500/15',
      neutralSoft: 'bg-slate-800',
      tabBar: 'bg-slate-900',
      tabActive: 'bg-white',
      tabActiveText: 'text-teal-700',
      secondaryButton: 'bg-slate-800',
      secondaryButtonBorder: 'border-slate-700',
      secondaryButtonText: 'text-slate-100',
      colors: {
        page: '#020617',
        pageAlt: '#0f172a',
        surface: '#0f172a',
        surfaceAlt: '#1e293b',
        surfaceMuted: '#1e293b',
        surfaceInset: '#1e293b',
        text: '#f8fafc',
        textMuted: '#94a3b8',
        textSoft: '#cbd5e1',
        border: '#334155',
        shadow: 'rgba(0,0,0,0.3)',
        iconCard: 'rgba(245,158,11,0.2)',
        accentSoft: 'rgba(20,184,166,0.15)',
        amberSoft: 'rgba(245,158,11,0.15)',
        skySoft: 'rgba(14,165,233,0.15)',
        successSoft: 'rgba(16,185,129,0.15)',
        dangerSoft: 'rgba(244,63,94,0.15)',
        neutralSoft: '#1e293b',
        tabBar: '#0f172a',
        tabActive: '#ffffff',
        secondaryButton: '#1e293b'
      },
      iconColor: '#f59e0b',
      textColor: '#f8fafc',
      textMutedColor: '#94a3b8',
      textSoftColor: '#cbd5e1',
      accentTextColor: '#5eead4',
      tabInactiveIcon: '#e2e8f0',
      tabActiveIcon: '#0f766e',
      tabActiveTextColor: '#0f766e',
      secondaryButtonBorderColor: '#334155',
      secondaryButtonTextColor: '#f1f5f9',
      primaryButtonTextColor: '#f8fafc'
    } :
    {
      mode: 'light',
      statusBar: 'dark',
      navigation: 'light',
      page: 'bg-slate-50',
      pageBackground,
      pageAlt: 'bg-white',
      surface: 'bg-white',
      surfaceAlt: 'bg-white',
      surfaceMuted: 'bg-slate-100',
      surfaceInset: 'bg-slate-50',
      text: 'text-slate-900',
      textMuted: 'text-slate-500',
      textSoft: 'text-slate-600',
      border: 'border-slate-200',
      shadow: 'shadow-slate-900/10',
      iconCard: 'bg-amber-100',
      accentText: 'text-teal-700',
      accentSoft: 'bg-teal-50',
      amberSoft: 'bg-amber-50',
      skySoft: 'bg-sky-50',
      successSoft: 'bg-emerald-50',
      dangerSoft: 'bg-rose-50',
      neutralSoft: 'bg-slate-100',
      tabBar: 'bg-teal-700',
      tabActive: 'bg-white',
      tabActiveText: 'text-teal-700',
      secondaryButton: 'bg-white',
      secondaryButtonBorder: 'border-slate-300',
      secondaryButtonText: 'text-slate-900',
      colors: {
        page: '#f8fafc',
        pageAlt: '#ffffff',
        surface: '#ffffff',
        surfaceAlt: '#ffffff',
        surfaceMuted: '#f1f5f9',
        surfaceInset: '#f8fafc',
        text: '#0f172a',
        textMuted: '#64748b',
        textSoft: '#475569',
        border: '#e2e8f0',
        shadow: 'rgba(15,23,42,0.1)',
        iconCard: '#fef3c7',
        accentSoft: '#f0fdfa',
        amberSoft: '#fffbeb',
        skySoft: '#f0f9ff',
        successSoft: '#ecfdf5',
        dangerSoft: '#fff1f2',
        neutralSoft: '#f1f5f9',
        tabBar: '#0f766e',
        tabActive: '#ffffff',
        secondaryButton: '#ffffff'
      },
      iconColor: '#d97706',
      textColor: '#0f172a',
      textMutedColor: '#64748b',
      textSoftColor: '#475569',
      accentTextColor: '#0f766e',
      tabInactiveIcon: '#ffffff',
      tabActiveIcon: '#0f766e',
      tabActiveTextColor: '#0f766e',
      secondaryButtonBorderColor: '#cbd5e1',
      secondaryButtonTextColor: '#0f172a',
      primaryButtonTextColor: '#f8fafc'
    },
    [isDark]
  );

  return {
    themeMode,
    setThemeMode,
    isThemeReady,
    isDark,
    palette
  };
}