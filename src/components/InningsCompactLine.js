import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { oversStr } from '../engine/helpers';
import { toggleInningsCard } from '../engine/actions/innings';
import Card from './Card';
import ScorecardBlock from './ScorecardBlock';

export default function InningsCompactLine({ inn, n, expanded }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Pressable onPress={() => toggleInningsCard(n)}>
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={[styles.team, { color: colors.floodlight }]}>{inn.battingName}</Text>
            <Text style={[styles.score, { color: colors.floodlight }]}>
              {inn.runs}/{inn.wickets} ({oversStr(inn.legalBalls)} ov)
            </Text>
          </View>
          <Text style={[styles.toggle, { color: colors.chalk }]}>
            {expanded ? '▾ Hide full scorecard' : '▸ Show full scorecard'}
          </Text>
        </Card>
      </Pressable>
      {expanded ? <ScorecardBlock inn={inn} inningsNum={n} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    gap: 10,
  },
  card: {
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  team: {
    fontFamily,
    fontSize: 15,
    fontWeight: '700',
  },
  score: {
    fontFamily,
    fontSize: 15,
  },
  toggle: {
    fontFamily,
    fontSize: 12,
  },
});
