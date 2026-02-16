import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'no-console': 'off',
    },
  },
];
