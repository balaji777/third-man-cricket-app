// Minimal fake DOM + localStorage so js/app.js (a browser script that renders
// to document#app and persists state on load) can be require()'d in Node.
// Only the surface app.js actually touches at module-load time is stubbed.

function makeElement() {
  return {
    className: '',
    innerHTML: '',
    querySelector: function () {
      return null;
    }
  };
}

function installDomStub() {
  var store = {};
  global.localStorage = {
    getItem: function (k) {
      return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
    },
    setItem: function (k, v) {
      store[k] = String(v);
    },
    removeItem: function (k) {
      delete store[k];
    }
  };
  global.document = {
    getElementById: function () {
      return makeElement();
    }
  };
  global.window = global.window || {};
  global.console = console;
}

module.exports = { installDomStub: installDomStub };
