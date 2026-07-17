// Ball-ticker coloring, shared between ScoreBoard's current-over ticker and
// the Super Over scoring screen's log -- both render the same log-string
// formats ('4', '6', 'W', 'wd'/'nb'/'b'/'lb' extras) the scoring engine
// produces. Ported from the source's ballClass().
export function ballStyle(b, colors) {
  if (b === '4') return { backgroundColor: colors.amber };
  if (b === '6') return { backgroundColor: colors.red };
  if (b === 'W') return { backgroundColor: colors.red };
  if (/^(wd|nb|b|lb|db)/.test(b)) {
    return { backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.teal };
  }
  return { backgroundColor: colors.panel2 };
}

export function ballTextColor(b, colors) {
  if (b === '4') return colors.runBtnInk;
  if (b === '6' || b === 'W') return '#FFFFFF';
  return colors.floodlight;
}
