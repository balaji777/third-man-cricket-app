import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { buildWormChartPoints } from '../engine/helpers';

// Ported from the source's buildWormChartSVG() + its inline legend markup.
// The point geometry is computed in engine/helpers.js (RN-free, unit
// tested); this component only lays out the react-native-svg primitives and
// the legend row.
export default function WormChart() {
  const { colors } = useTheme();
  const chart = buildWormChartPoints();

  const gridLines = [0, 1, 2, 3, 4].map(g => {
    const y = chart.padT + (g / 4) * (chart.height - chart.padT - chart.padB);
    return (
      <Line
        key={g}
        x1={chart.padL}
        y1={y}
        x2={chart.width - chart.padR}
        y2={y}
        stroke={colors.line}
        strokeWidth={1}
      />
    );
  });

  return (
    <View>
      <Svg viewBox={`0 0 ${chart.width} ${chart.height}`} style={styles.svg}>
        {gridLines}
        <Polyline points={chart.team1Points} fill="none" stroke={colors.amberInk} strokeWidth={2} />
        <Polyline points={chart.team2Points} fill="none" stroke={colors.teal} strokeWidth={2} />
      </Svg>
      <View style={styles.legend}>
        <LegendEntry color={colors.amberInk} label={chart.team1Name} textColor={colors.chalk} />
        <LegendEntry color={colors.teal} label={chart.team2Name} textColor={colors.chalk} />
      </View>
    </View>
  );
}

function LegendEntry({ color, label, textColor }) {
  return (
    <View style={styles.legendEntry}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendLabel, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  svg: {
    width: '100%',
    height: undefined,
    aspectRatio: 300 / 170,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
  },
  legendEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontFamily,
    fontSize: 11,
  },
});
