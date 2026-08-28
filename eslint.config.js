import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'

export default [
  {
    ignores: ['dist', 'coverage'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        __BUILD_COMMIT__: 'readonly',
        __BUILD_TIME__: 'readonly',
      },
      parser: tseslint.parser,
    },
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@typescript-eslint/array-type': ['warn', { default: 'generic', readonly: 'generic' }],
      '@stylistic/operator-linebreak': ['warn', 'before', { overrides: { '=': 'after' } }],
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        __BUILD_COMMIT__: 'readonly',
        __BUILD_TIME__: 'readonly',
      },
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
    },
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      'vue/block-order': [
        'error',
        {
          order: ['script', 'template', 'style'],
        },
      ],
      '@typescript-eslint/array-type': ['warn', { default: 'generic', readonly: 'generic' }],
      '@stylistic/operator-linebreak': ['warn', 'before', { overrides: { '=': 'after' } }],
      // Core and stylistic rules do not reach `<template>` expressions.
      'vue/operator-linebreak': ['warn', 'before', { overrides: { '=': 'after' } }],
    },
  },
  {
    files: ['**/*.{test,spec}.{js,jsx,ts,tsx,vue}'],
    rules: {
      'vue/one-component-per-file': 'off',
    },
  },
]
