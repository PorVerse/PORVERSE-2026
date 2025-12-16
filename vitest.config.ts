import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment
    environment: 'jsdom',
    globals: true,
    
    // Setup files
    setupFiles: ['./tests/setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      
      // Coverage thresholds (SUPER ENTERPRISE INTERSTELLAR)
      lines: 90,
      functions: 90,
      branches: 85,
      statements: 90,
      
      // Exclude patterns
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/__mocks__'
      ]
    },
    
    // Include/Exclude patterns
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
    
    // Test timeout
    testTimeout: 10000,
    
    // Reporters
    reporters: ['verbose']
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})