module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.eslint.json'
  },
  plugins: ['@typescript-eslint'],
  ignorePatterns: [
    'dist/**',
    'coverage/**',
    'examples/**',
    'scripts/**',
  'debug-undo.*',
    '*.js',
    '*.d.ts'
  ],
  overrides: [
    {
      files: ['**/*.ts'],
      excludedFiles: ['dist/**'],
      rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-inferrable-types': 'warn',
  'no-console': 'warn',
  'prefer-const': 'warn',
        'no-var': 'error'
      }
    },
    {
      files: ['tests/**/*.ts'],
      rules: {
    'no-console': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/no-explicit-any': 'off',
  'prefer-const': 'off'
      }
    }
  ]
};
