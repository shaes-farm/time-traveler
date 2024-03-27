import { Roboto } from 'next/font/google';
import { createTheme, type ThemeOptions } from '@mui/material/styles';

const font = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const commonOptions: ThemeOptions = {
  typography: {
    fontFamily: font.style.fontFamily,
    h1: {
      fontSize: '3rem',
    },
    h2: {
      fontSize: '2rem',
    },
    h3: {
      fontSize: '1.5rem',
    },
    h4: {
      fontSize: '1.25rem',
    },
    h5: {
      fontSize: '1.0rem',
    },
    h6: {
      fontSize: '0.75rem',
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '1px solid #242424',
        },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: 'light',
  }
});

export const darkTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: 'dark',
    background: {
      default: '#000000',
      paper: '#0a0a0a',
    },
    text: {
      primary: '#ededed',
      secondary: '#dddddd',
      disabled: '#7f7f7f',
    },
    primary: {
      main: '#ededed',
      light: '#f0f0f0',
      dark: '#c0c0c0',
      contrastText: 'rgba(0, 0, 0, 0.87)',
    },
    divider: 'rgba(255, 255, 255, 0.16)',
  },
});
