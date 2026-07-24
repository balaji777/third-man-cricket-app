module.exports = {
  preset: '@react-native/jest-preset',
  // The engine/sync/history/leaderboard/export test suites are written for
  // Node's built-in node:test runner (see package.json's test:engine) so
  // they stay RN-free and runnable under plain `node --test`. Jest can't
  // collect node:test-registered tests as its own -- it would mark every
  // one of these suites as failed even though the tests themselves pass --
  // so they're excluded here. Real RN component tests (react-test-renderer)
  // belong outside these directories.
  testPathIgnorePatterns: ['/node_modules/', '/src/.+/__tests__/'],
};
