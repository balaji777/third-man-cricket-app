import React from 'react';
import { StyleSheet, View } from 'react-native';
import { openExtraPopup } from '../engine/actions/scoring';
import Button from './Button';

const EXTRAS = [
  { type: 'wd', label: 'Wide' },
  { type: 'nb', label: 'No ball' },
  { type: 'b', label: 'Bye' },
  { type: 'lb', label: 'Leg bye' },
];

export default function ExtrasRow() {
  return (
    <View style={styles.row}>
      {EXTRAS.map(e => (
        <Button
          key={e.type}
          label={e.label}
          variant="ghost"
          style={styles.btn}
          onPress={() => openExtraPopup(e.type)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  btn: {
    flexBasis: '47%',
    flexGrow: 1,
  },
});
