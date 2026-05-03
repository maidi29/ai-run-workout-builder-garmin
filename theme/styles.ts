import { StyleSheet } from "react-native";
import { colors } from "./colors";
import { fontSize, fontFamily } from "./typography";

export const sharedStyles = StyleSheet.create({
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 99,
    alignItems: "center",
    elevation: 4,
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderDark,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
  },
});
