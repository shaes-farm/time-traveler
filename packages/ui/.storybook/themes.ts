/* eslint-disable camelcase -- cannot control these names */
import { Roboto } from 'next/font/google'
import { unstable_createMuiStrictModeTheme } from '@mui/material/styles';
import { blueGrey, cyan, pink } from '@mui/material/colors';

export const font = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Helvetica', 'Arial', 'sans-serif'],
});

export const lightTheme = unstable_createMuiStrictModeTheme({
  palette: {
    mode: 'light',
    primary: {
      main: cyan.A200,
    },
    secondary: {
      main: pink.A400,
    },
  },
  typography: {
    fontFamily: font.style.fontFamily,
  },
});

export const darkTheme = unstable_createMuiStrictModeTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: pink.A400,
    },
    secondary: {
      main: cyan.A700,
    },
    background: {
      default: blueGrey['800'],
      paper: blueGrey['700'],
    },
  },
  typography: {
    fontFamily: font.style.fontFamily,
  },
});