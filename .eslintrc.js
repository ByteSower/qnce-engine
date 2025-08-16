module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      files: ['**/*.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/prefer-const': 'error',
        '@typescript-eslint/no-inferrable-types': 'error',
        'no-console': 'warn',
        'prefer-const': 'error',
        'no-var': 'error'
      }
    },
    {
      files: ['tests/**/*.ts'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
