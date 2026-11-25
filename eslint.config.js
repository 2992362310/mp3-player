import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'public/**', 'dev-dist/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['src/**/*.vue'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
  },
  {
    files: ['src/**/*.{ts,vue}'],
    languageOptions: { globals: globals.browser },
    rules: {
      // 第三方接口的 raw 字段确需 any，其余保持警告即可
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // 风格由既有代码与模板保持一致，不交给 lint 强制
      'vue/multi-word-component-names': 'off',
      'vue/attributes-order': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/html-self-closing': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-indent': 'off',
      'vue/attribute-hyphenation': 'off',
      'vue/v-on-event-hyphenation': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/html-closing-bracket-newline': 'off',
    },
  },
  {
    files: ['*.config.ts', '*.config.js'],
    languageOptions: { globals: globals.node },
  },
);
