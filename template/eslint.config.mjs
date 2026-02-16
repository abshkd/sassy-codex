import tseslint from 'typescript-eslint';

export default tseslint.config({
  files: ['**/*.{ts,tsx,mts,cts}'],
  ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
  languageOptions: {
    parserOptions: {
      projectService: false,
    },
  },
  rules: {
    'no-console': 'off',
  },
});
