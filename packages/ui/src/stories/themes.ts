import { unstable_createMuiStrictModeTheme } from '@mui/material/styles';
import { blueGrey, cyan, pink } from '@mui/material/colors';

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
    fontFamily: 'Roboto',
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
    fontFamily: 'Roboto',
  },
});