import js from '@eslint/js';

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  localStorage: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  navigator: 'readonly',
  Image: 'readonly',
  Blob: 'readonly',
  File: 'readonly',
  URL: 'readonly',
  module: 'readonly'
};

export default [
  js.configs.recommended,
  {
    files: ['js/app.js'],
    languageOptions: {
      sourceType: 'script',
      ecmaVersion: 2021,
      globals: browserGlobals
    },
    rules: {
      // app.js is a single classic script: most top-level functions are entry
      // points invoked from onclick="..." strings inside generated HTML, which
      // ESLint has no way to see as "usage". no-unused-vars would be almost
      // entirely false positives here, so it's turned off for this file.
      'no-unused-vars': 'off'
    }
  },
  {
    files: ['js/firebase-init.js'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2021,
      globals: browserGlobals
    }
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      ecmaVersion: 2021,
      globals: {
        ...browserGlobals,
        require: 'readonly',
        module: 'writable',
        global: 'writable',
        process: 'readonly'
      }
    }
  },
  {
    ignores: ['node_modules/**']
  }
];
