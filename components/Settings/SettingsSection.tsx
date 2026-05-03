import { View, StyleSheet } from "react-native";
import { AppText as Text } from "../AppText";
import { colors, fontSize, fontFamily } from "../../theme";

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

interface SettingsCardProps {
  children: React.ReactNode;
  style?: object;
}

export function SettingsCard({ children, style }: SettingsCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
});
