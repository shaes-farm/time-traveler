import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@mui/icons-material';

import type { Preview } from "@storybook/react";
import { CssBaseline, ThemeProvider } from '@mui/material';
import { withThemeFromJSXProvider } from '@storybook/addon-themes';
import { lightTheme, darkTheme } from '../src/stories/themes';

const preview: Preview = {
  decorators: [
    withThemeFromJSXProvider({
      themes: {
        Light: lightTheme,
        Dark: darkTheme,
      },
      defaultTheme: 'Light',
      Provider: ThemeProvider,
      GlobalStyles: CssBaseline,
    })
  ],  
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      expanded: true, // Adds the description and default columns
      matchers: {
        color: /(background|color)$/i,
        date: /(At|On)$/,
      },
    }
  },
};

export default preview;
