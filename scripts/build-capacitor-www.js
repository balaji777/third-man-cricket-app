// Copies the site's static source files into www/, which Capacitor bundles
// into the native Android/iOS apps. index.html/css/js/icons/manifest.json
// stay the single source of truth at the repo root for the hosted web
// version; this just mirrors them into the generated Capacitor build input.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dest = path.join(root, 'www');

const entries = ['index.html', 'privacy.html', 'manifest.json', 'css', 'js', 'icons'];

function copyRecursive(src, target) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(target, child));
    }
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(src, target);
  }
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });

for (const entry of entries) {
  copyRecursive(path.join(root, entry), path.join(dest, entry));
}

console.log('Copied ' + entries.join(', ') + ' into www/');
