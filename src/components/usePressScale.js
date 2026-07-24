import { useRef } from 'react';
import { Animated } from 'react-native';

// Shared tactile press-feedback for every tappable surface (Button, Chip,
// NumPad cells, Topbar icons): scales down on press-in, springs back on
// release. useNativeDriver keeps it off the JS thread since it only ever
// touches transform.
export default function usePressScale(pressedScale = 0.94) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.timing(scale, {
      toValue: pressedScale,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 20,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
  };

  return { scale, onPressIn, onPressOut };
}
