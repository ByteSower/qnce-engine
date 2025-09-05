module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-inferrable-types': 'error',
        'no-console': 'warn',
        'prefer-const': 'error',
        'no-var': 'error'
      }
    },
    {
      files: ['tests/**/*.ts', 'src/ui/**/__tests__/**/*.ts', 'src/ui/**/__tests__/**/*.tsx'],
      rules: {
        'no-console': 'off'
      }
    }
  ],
  ignorePatterns: [
    'dist/',
    'coverage/',
    'scripts/**/*',
    'examples/**/*',
    'test-demo.js'
  ]
};
