// Flat aggregate of the engine's public surface, mirroring the shape of the
// source js/app.js's own module.exports (its test-only export hook). Exists
// so the ported test suite can import one module the same way the original
// tests imported '../js/app.js', and as a convenience import for screens.
module.exports = Object.assign(
  {},
  require('./state'),
  require('./helpers'),
  require('./store'),
  require('./actions/toss'),
  require('./actions/setup'),
  require('./actions/scoring'),
  require('./actions/dismissal'),
  require('./actions/popupQueue'),
  require('./actions/innings'),
  require('./actions/superOver')
);
