import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(_on, _config) {
      // Add node event handlers
    },
  },
});
