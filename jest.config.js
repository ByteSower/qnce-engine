module.exports = {
  preset: 'ts-jest',
  projects: [
    // Node.js tests (existing engine tests)
    {
      displayName: 'node',
      testEnvironment: 'node',
      roots: ['<rootDir>/src', '<rootDir>/tests'],
      testMatch: [
        '**/__tests__/**/*.ts',
        '**/?(*.)+(spec|test).ts'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/ui/'
      ],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/cli/**/*.ts',
        '!src/ui/**'
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
    },
    // React/UI tests
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/src/ui/__tests__/setup.ts'],
      roots: ['<rootDir>/src/ui'],
      testMatch: [
        '<rootDir>/src/ui/**/__tests__/**/*.test.{ts,tsx}',
        '<rootDir>/src/ui/**/*.test.{ts,tsx}'
      ],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            jsx: 'react-jsx'
          }
        }]
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      collectCoverageFrom: [
        'src/ui/**/*.{ts,tsx}',
        '!src/ui/**/*.d.ts',
        '!src/ui/__tests__/**'
      ]
    }
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  verbose: true
};
