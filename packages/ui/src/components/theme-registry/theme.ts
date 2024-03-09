import { Roboto } from 'next/font/google';
import { createTheme } from '@mui/material/styles';

const font = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
  typography: {
    fontFamily: font.style.fontFamily,
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#000000',
    },
    text: {
      primary: '#ffffff',
    }
  },
  typography: {
    fontFamily: font.style.fontFamily,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '1px solid #333',
        },
      },
    },
  },
});
