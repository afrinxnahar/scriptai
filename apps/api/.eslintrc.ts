module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  extends: [
    'plugin:@darraghor/nestjs-typed/recommended',
  ],
  plugins: [
    '@darraghor/nestjs-typed',
  ],
  rules: {
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.spec.ts'],
};