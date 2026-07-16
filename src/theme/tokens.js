import { Platform } from 'react-native';

// Mirrors the CSS custom properties in the retired web app's css/styles.css.
// `background` is the outer page/app background -- the source swaps this to a
// white/near-white gradient in light mode via a separate `.light` rule, it's
// not driven by --pitch (which itself is never redefined for light mode).
export const darkTheme = {
  background: '#0E1A15',
  pitch: '#0E1A15',
  pitchLight: '#173025',
  navy: '#080B10',
  panel: '#12211B',
  panel2: '#0E1913',
  floodlight: '#F3F5EF',
  amber: '#F5B24A',
  amberInk: '#F5B24A',
  amberDim: '#7A5A22',
  teal: '#3FB2A3',
  red: '#D6573F',
  chalk: '#93A69C',
  chalkDim: '#57685F',
  line: 'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.14)',
  runBtnInk: '#2b1c05',
};

export const lightTheme = {
  ...darkTheme,
  background: '#F7F8F4',
  panel: '#FFFFFF',
  panel2: '#EEF1EA',
  floodlight: '#182019',
  chalk: '#5C6B62',
  chalkDim: '#8A9890',
  line: 'rgba(0,0,0,0.10)',
  lineStrong: 'rgba(0,0,0,0.18)',
  teal: '#1F8478',
  red: '#B94430',
  amberInk: '#A8690F',
};

// RN shadow needs separate iOS (shadow*) and Android (elevation) props.
export function shadowCard(theme) {
  if (Platform.OS === 'android') {
    return { elevation: theme === 'light' ? 3 : 6 };
  }
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: theme === 'light' ? 4 : 6 },
    shadowOpacity: theme === 'light' ? 0.08 : 0.4,
    shadowRadius: theme === 'light' ? 14 : 22,
  };
}
