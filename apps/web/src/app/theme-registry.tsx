'use client';
import React, {useState} from 'react';
import createCache, {type Options} from '@emotion/cache';
import {useServerInsertedHTML} from 'next/navigation';
import {CacheProvider} from '@emotion/react';
import {ThemeProvider} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {theme} from './theme';

interface ThemeRegistryProps {
  options: Options;
  children: React.ReactNode;
}

// This implementation is from emotion-js
// https://github.com/emotion-js/emotion/issues/2928#issuecomment-1319747902
export function ThemeRegistry(props: ThemeRegistryProps): JSX.Element {
  const { options, children } = props;

  // eslint-disable-next-line react/hook-use-state -- because its all we need
  const [{ cache, flush }] = useState(() => {
    const emotionCache = createCache(options);
    emotionCache.compat = true;
    // eslint-disable-next-line @typescript-eslint/unbound-method -- because we like it
    const prevInsert = emotionCache.insert;
    let inserted: string[] = [];
    emotionCache.insert = (...args) => {
      const serialized = args[1];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- because it works
      if (emotionCache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flushIt = (): string[] => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache: emotionCache, flush: flushIt };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) {
      return null;
    }
    let styles = '';
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        dangerouslySetInnerHTML={{__html: styles}}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        key={cache.key}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
