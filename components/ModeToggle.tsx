import { View, TouchableOpacity, StyleSheet } from "react-native";
import { AppText as Text } from "./AppText";
import { colors, fontSize, fontFamily } from "../theme";

interface ModeToggleProps {
  options: [string, string];
  activeIndex: number;
  onToggle: (index: number) => void;
}

export function ModeToggle({
  options,
  activeIndex,
  onToggle,
}: ModeToggleProps) {
  return (
    <View style={styles.row}>
      {options.map((option, i) => (
        <TouchableOpacity
          key={option}
          style={[styles.option, activeIndex === i && styles.optionActive]}
          onPress={() => onToggle(i)}
        >
          <Text style={[styles.text, activeIndex === i && styles.textActive]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  option: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: colors.backgroundTertiary,
  },
  optionActive: {
    backgroundColor: colors.primary,
  },
  text: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
  },
  textActive: {
    color: colors.textInverse,
  },
});
