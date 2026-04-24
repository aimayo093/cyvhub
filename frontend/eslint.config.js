const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      // React Native Text nodes do not need HTML entity escaping, and this rule
      // creates noisy false failures across the Expo app.
      "react/no-unescaped-entities": "off",
    },
  }
]);
