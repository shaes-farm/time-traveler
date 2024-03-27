'use client';

import React from 'react';
import {ThemeProvider} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {NextAppDirEmotionCacheProvider} from './emotion-cache';
import {darkTheme, lightTheme} from './theme';

interface ThemeRegistryProps {
  theme?: 'dark' | 'light';
  children: React.ReactNode;
}

export function ThemeRegistry({ theme = 'dark', children }: ThemeRegistryProps): JSX.Element {
  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme === 'dark' ? darkTheme : lightTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </NextAppDirEmotionCacheProvider>
  );
}
