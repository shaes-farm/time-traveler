'use client';
import React from 'react';
import {ThemeProvider} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {NextAppDirEmotionCacheProvider} from './emotion-cache';
import {darkTheme, lightTheme} from './theme';

export function ThemeRegistry({ children }: { children: React.ReactNode }): JSX.Element {
  const {theme} = localStorage;
  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </NextAppDirEmotionCacheProvider>
  );
}
