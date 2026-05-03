import { View, Image, StyleSheet } from "react-native";
import { AppText as Text } from "./AppText";
import { colors, fontSize, spacing, fontFamily } from "../theme";

interface ErrorBoxProps {
  title?: string;
  message: string;
}

export function ErrorBox({ title, message }: ErrorBoxProps) {
  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.titleRow}>
          <Image
            source={require("../assets/xmark.png")}
            style={styles.titleIcon}
          />
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.errorLight,
    borderColor: colors.errorBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  titleIcon: {
    width: 20,
    height: 20,
  },
  title: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    color: colors.error,
  },
  text: {
    fontSize: fontSize.md,
    color: colors.error,
  },
});
