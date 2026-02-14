import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@generators': path.resolve(__dirname, './src/generators'),
      '@ai': path.resolve(__dirname, './src/ai'),
    },
  },
});
