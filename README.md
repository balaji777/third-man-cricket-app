# Third Man — Cricket Scorer

A ball-by-ball cricket scoring PWA: toss, powerplay overs, dismissal tracking,
super overs, run-rate charts, PDF export, shareable scorecards, and a
Firebase-backed match history and leaderboard.

It's a plain static site — no build step, no framework, no bundler. `index.html`
loads `js/app.js` as a classic script and `js/firebase-init.js` as an ES module.

## Project structure

```
index.html              entry point
css/styles.css          all styling
js/app.js               app state, screens, and scoring logic (single script)
js/firebase-init.js     Firebase app/auth/firestore setup (ES module)
icons/, manifest.json   PWA metadata and icons
firestore.rules         security rules for per-user match history
firebase.json           Firestore rules deploy config
_headers                response headers for static hosting (COOP for auth popups)
test/                   node:test suite for the scoring logic in js/app.js
```

## Running locally

Since it's a static site, any local web server works — opening `index.html`
directly from disk won't work because Firebase Auth popups require an http(s)
origin. For example:

```
npx serve .
# or
python -m http.server 8000
```

Then open the printed URL in a browser.

## Firebase

Auth (Google sign-in + anonymous/guest) and Firestore (per-user match history)
are configured in `js/firebase-init.js` against the `third-man-cricket`
Firebase project. Firestore security rules live in `firestore.rules` — deploy
changes to them with:

```
firebase deploy --only firestore:rules
```

The static site itself can be deployed to any static host (Cloudflare Pages,
Netlify, Firebase Hosting, GitHub Pages, ...); `_headers` sets the
Cross-Origin-Opener-Policy needed for the Google sign-in popup to work.

## Development scripts

```
npm test           # run the scoring-logic test suite (node's built-in test runner)
npm run lint       # eslint over js/ and test/
npm run format     # prettier --write over js/, css/, and html
npm run format:check
```

`npm install` is only needed for `lint`/`format` (eslint + prettier as dev
dependencies) — `npm test` uses Node's built-in test runner and has no
dependencies of its own.

Note: `js/app.js` has never been run through Prettier, so the first
`npm run format` will produce a large, purely cosmetic diff. Do that as its
own deliberate commit rather than mixed in with a logic change.

## Testing approach

`js/app.js` is a browser script, not a module, so `test/helpers/domStub.js`
stubs just enough of `document`/`window`/`localStorage` for it to load in
Node, and a small guarded `module.exports` block at the bottom of `app.js`
(a no-op in the browser) exposes the scoring functions to tests. See
`test/*.test.js` for coverage of ball-by-ball scoring, dismissals, innings-end
conditions, and a few regression tests for bugs found in past audits.
