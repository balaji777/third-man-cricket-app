import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import { striker, nonStriker } from '../engine/helpers';

export default function PartnershipLine({ inn }) {
  const { colors } = useTheme();
  const pRuns = inn.runs - inn.partnershipStartRuns;
  const pBalls = inn.legalBalls - inn.partnershipStartBalls;

  return (
    <Text style={[styles.text, { color: colors.chalk }]}>
      Partnership: <Text style={[styles.bold, { color: colors.floodlight }]}>{pRuns}</Text> (
      {pBalls}) between {striker(inn).name} &amp; {nonStriker(inn).name}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily,
    fontSize: 13,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bold: {
    fontWeight: '700',
  },
});
