  import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js';
  import {
    getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously,
    onAuthStateChanged, signOut, linkWithPopup, signInWithCredential, linkWithCredential,
    setPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence
  } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';
  import {
    getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
    collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, limit, serverTimestamp
  } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';

  const firebaseConfig = {
    apiKey: "AIzaSyBpddbbs4hzry1H2qOb3K9K3RQdgGnjdAk",
    authDomain: "third-man-cricket.firebaseapp.com",
    projectId: "third-man-cricket",
    storageBucket: "third-man-cricket.firebasestorage.app",
    messagingSenderId: "45655423481",
    appId: "1:45655423481:web:e4490a79ba7ac3941fa528",
    measurementId: "G-DCG65TMJGG"
  };

  const fbApp = initializeApp(firebaseConfig);
  const auth = getAuth(fbApp);

  // Persistent (IndexedDB-backed) local cache so writes made while offline
  // queue on-device and sync automatically on reconnect, instead of just
  // failing. Falls back to the default in-memory cache in environments
  // without IndexedDB (e.g. private browsing in old Safari).
  let db;
  try {
    db = initializeFirestore(fbApp, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
    console.log('[firestore] offline persistence: enabled (multi-tab)');
  } catch (err) {
    console.warn('[firestore] offline persistence unavailable, falling back to in-memory cache:', err);
    db = getFirestore(fbApp);
  }

  window.__fb = {
    auth, db, GoogleAuthProvider, signInWithPopup, signInAnonymously,
    signOut, linkWithPopup, signInWithCredential, linkWithCredential,
    collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, limit, serverTimestamp
  };

  setPersistence(auth, browserLocalPersistence)
    .then(function(){ console.log('[auth] persistence: browserLocal OK'); })
    .catch(function(err1){
      console.warn('[auth] browserLocalPersistence failed:', err1);
      setPersistence(auth, browserSessionPersistence)
        .then(function(){ console.log('[auth] persistence: browserSession OK (fallback)'); })
        .catch(function(err2){
          console.warn('[auth] browserSessionPersistence failed:', err2);
          setPersistence(auth, inMemoryPersistence)
            .then(function(){ console.log('[auth] persistence: inMemory OK (last resort — session will not survive reload)'); })
            .catch(function(err3){ console.error('[auth] ALL persistence methods failed:', err3); });
        });
    });

  onAuthStateChanged(auth, function(user){
    console.log('[auth] onAuthStateChanged:', user);
    if(window.onFirebaseAuthChange) window.onFirebaseAuthChange(user);
  });
