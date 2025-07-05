module.exports = {
  env: {
    node: true,
    jest: true,
    es2022: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  overrides: [
    {
      files: ['tests/**/*.ts'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
