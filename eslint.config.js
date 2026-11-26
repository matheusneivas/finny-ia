// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
  {
    rules: {
      // Segurança: nada de console.* no app (pode vazar tokens e dados financeiros em logs).
      'no-console': 'error',
    },
  },
]);
