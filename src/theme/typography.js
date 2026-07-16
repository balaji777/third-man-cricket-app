import { Platform } from 'react-native';

// The source web app uses 'Times New Roman', Times, serif everywhere for a
// deliberate "scorecard/newspaper" look. iOS ships real Times New Roman as a
// system font; Android's generic 'serif' resolves to Noto Serif (same family,
// not a pixel match). Bundling Tinos (metrically Times-compatible) is a later
// polish pass, not required for Phase 1.
export const fontFamily = Platform.OS === 'ios' ? 'Times New Roman' : 'serif';
