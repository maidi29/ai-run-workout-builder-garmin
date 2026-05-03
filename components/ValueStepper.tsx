import { View, TouchableOpacity, StyleSheet } from "react-native";
import { AppText as Text } from "./AppText";
import { colors, fontSize, fontFamily } from "../theme";

interface ValueStepperProps {
  label: string;
  displayValue: string;
  onIncrement: () => void;
  onDecrement: () => void;
  decrementDisabled?: boolean;
}

export function ValueStepper({
  label,
  displayValue,
  onIncrement,
  onDecrement,
  decrementDisabled,
}: ValueStepperProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.btn, decrementDisabled && styles.btnDisabled]}
          onPress={onDecrement}
          disabled={decrementDisabled}
        >
          <Text
            style={[
              styles.btnText,
              decrementDisabled && styles.btnTextDisabled,
            ]}
          >
            −
          </Text>
        </TouchableOpacity>
        <Text style={styles.value}>{displayValue}</Text>
        <TouchableOpacity style={styles.btn} onPress={onIncrement}>
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surfaceButton,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnText: {
    fontSize: 20,
    fontFamily: fontFamily.semibold,
    color: colors.text,
  },
  btnTextDisabled: {
    color: colors.textMuted,
  },
  value: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    color: colors.text,
    minWidth: 80,
    textAlign: "center",
  },
});
