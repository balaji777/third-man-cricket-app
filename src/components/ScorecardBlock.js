import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';
import {
  oversStr,
  strikeRate,
  extrasTotal,
  formatTime12hr,
  formatDuration,
  powerplayScore,
} from '../engine/helpers';
import { getState } from '../engine/state';
import { exportInningsPDF } from '../export/pdfExport';
import { shareInnings } from '../export/share';
import Card from './Card';
import Button from './Button';

// Full per-innings scorecard: batting figures, extras, bowling figures,
// fall of wickets, and partnerships, plus (M14) a per-innings PDF/share
// pair. Ported from the source's scorecardBlock().
export default function ScorecardBlock({ inn, inningsNum }) {
  const { colors } = useTheme();
  const pp = powerplayScore(inn);
  const state = getState();
  const isGuest = !!(state.user && state.user.isAnonymous);

  const strikerObj = inn.batsmen[inn.strikerIdx];
  const nonStrikerObj = inn.batsmen[inn.nonStrikerIdx];
  const showUnbeatenPartnership =
    inn.wicketLog.length > 0 && strikerObj && !strikerObj.out && nonStrikerObj && !nonStrikerObj.out;

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: colors.floodlight }]}>
        {inn.battingName} — {inn.runs}/{inn.wickets} ({oversStr(inn.legalBalls)} ov)
      </Text>
      {inn.startTime ? (
        <Text style={[styles.timing, { color: colors.chalk }]}>
          Started {formatTime12hr(inn.startTime)}
          {inn.endTime
            ? ' · finished ' + formatTime12hr(inn.endTime) + ' · took ' + formatDuration(inn.startTime, inn.endTime)
            : ''}
        </Text>
      ) : null}

      {pp ? (
        <ResultLine
          left={`Powerplay (${state.powerplayOvers} ov)`}
          right={`${pp.runs}/${pp.wkts} (${pp.oversDisplay})`}
          colors={colors}
        />
      ) : null}

      {inn.batsmen.map((b, i) => (
        <ResultLine
          key={i}
          left={b.name + (b.out ? '' : ' *')}
          right={`${b.runs} (${b.balls}) · SR ${strikeRate(b.runs, b.balls)}`}
          colors={colors}
        />
      ))}
      <ResultLine
        left="Extras"
        right={`${extrasTotal(inn)} (wd ${inn.extras.wd}, nb ${inn.extras.nb}, b ${inn.extras.b}, lb ${inn.extras.lb})`}
        colors={colors}
      />

      <View style={[styles.divider, { borderColor: colors.line }]} />

      {inn.bowlers.map((bw, i) => (
        <ResultLine
          key={i}
          left={bw.name}
          right={`${oversStr(bw.balls)}-${bw.runs}-${bw.wickets}`}
          colors={colors}
        />
      ))}

      {inn.wicketLog.length > 0 ? (
        <>
          <View style={[styles.divider, { borderColor: colors.line }]} />
          <Text style={[styles.sectionLabel, { color: colors.chalk }]}>Fall of wickets</Text>
          {inn.wicketLog.map((w, i) => (
            <ResultLine key={i} left={`${w.num}-${w.score}`} right={`${w.batsman} (${w.overs} ov)`} colors={colors} />
          ))}
          <Text style={[styles.sectionLabel, styles.partnershipsLabel, { color: colors.chalk }]}>
            Partnerships
          </Text>
          {inn.wicketLog.map((w, i) => (
            <ResultLine
              key={i}
              left={`${w.partner} & ${w.batsman}`}
              right={`${w.partnershipRuns} (${w.partnershipBalls})`}
              colors={colors}
            />
          ))}
          {showUnbeatenPartnership ? (
            <ResultLine
              left={`${nonStrikerObj.name} & ${strikerObj.name} (unbeaten)`}
              right={`${inn.runs - inn.partnershipStartRuns} (${inn.legalBalls - inn.partnershipStartBalls})`}
              colors={colors}
            />
          ) : null}
        </>
      ) : null}

      {inningsNum && !isGuest ? (
        <View style={styles.utilRow}>
          <Button
            label="Download PDF"
            variant="panel"
            style={styles.utilBtn}
            onPress={() => exportInningsPDF(inningsNum)}
          />
          <Button
            label="Share"
            variant="panel"
            style={styles.utilBtn}
            onPress={() => shareInnings(inningsNum)}
          />
        </View>
      ) : null}
    </Card>
  );
}

function ResultLine({ left, right, colors }) {
  return (
    <View style={styles.resultLine}>
      <Text style={[styles.resultText, { color: colors.chalk }]}>{left}</Text>
      <Text style={[styles.resultText, { color: colors.floodlight }]}>{right}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 4,
  },
  title: {
    fontFamily,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  timing: {
    fontFamily,
    fontSize: 11,
    marginBottom: 6,
  },
  resultLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  resultText: {
    fontFamily,
    fontSize: 13,
    flexShrink: 1,
  },
  divider: {
    borderTopWidth: 1,
    marginVertical: 8,
  },
  sectionLabel: {
    fontFamily,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  partnershipsLabel: {
    marginTop: 8,
  },
  utilRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  utilBtn: {
    flex: 1,
  },
});
