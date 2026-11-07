import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'src/routeTree.gen.ts', 'src/types/database.types.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Intentionally unused names can be prefixed with an underscore.
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      // Import convention (see .clinerules): use the "@/" alias, never parent-relative or "src/..." paths.
      // Same-directory "./" imports are fine.
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['../*'], message: 'Use the "@/" alias instead of parent-relative imports.' },
          { group: ['src/*'], message: 'Use the "@/" alias instead of "src/..." imports.' },
        ],
      }],
      // `any` in app code is tracked as debt: it warns (and CI caps the warning count) so it can only go down.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // Tests and mocks routinely need `any` to stub partial objects.
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**', '**/__mocks__/**', 'src/setupTests.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  },
])
