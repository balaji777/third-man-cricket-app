import React from 'react';
import { StyleSheet, View } from 'react-native';
import { addRuns } from '../engine/actions/scoring';
import Button from './Button';

// Two rows [0,1,2] and [3,4,6], matching the source's grid6 layout. 4 and 6
// get the amber/red accent treatment; the rest are neutral.
export default function RunButtons() {
  return (
    <View>
      <View style={styles.row}>
        {[0, 1, 2].map(n => (
          <Button key={n} label={String(n)} variant="panel" style={styles.btn} onPress={() => addRuns(n)} />
        ))}
      </View>
      <View style={styles.row}>
        <Button label="3" variant="panel" style={styles.btn} onPress={() => addRuns(3)} />
        <Button label="4" variant="amber" style={styles.btn} onPress={() => addRuns(4)} />
        <Button label="6" variant="red" style={styles.btn} onPress={() => addRuns(6)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  btn: {
    flex: 1,
  },
});
