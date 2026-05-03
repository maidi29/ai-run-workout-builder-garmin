import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface ToggleSwitchProps {
  value: boolean;
  onToggle: () => void;
}

export function ToggleSwitch({ value, onToggle }: ToggleSwitchProps) {
  return (
    <TouchableOpacity
      style={[styles.track, value && styles.trackActive]}
      onPress={onToggle}
    >
      <View style={[styles.knob, value && styles.knobActive]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.borderDark,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  trackActive: {
    backgroundColor: colors.primary,
  },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  knobActive: {
    alignSelf: 'flex-end',
  },
});
