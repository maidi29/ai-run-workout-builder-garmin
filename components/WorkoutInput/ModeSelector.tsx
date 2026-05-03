import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { AppText as Text } from "../AppText";
import { colors, fontSize, fontFamily } from "../../theme";

type InputMode = "text" | "image" | "suggest";

interface ModeSelectorProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  const modes: {
    key: InputMode;
    label: string;
    icon: ReturnType<typeof require>;
  }[] = [
    { key: "text", label: "Text", icon: require("../../assets/text.png") },
    { key: "image", label: "Image", icon: require("../../assets/image.png") },
    {
      key: "suggest",
      label: "Suggest",
      icon: require("../../assets/sparkle.png"),
    },
  ];

  return (
    <View style={styles.container}>
      {modes.map((m) => (
        <TouchableOpacity
          key={m.key}
          style={[styles.button, mode === m.key && styles.buttonActive]}
          onPress={() => onModeChange(m.key)}
        >
          <Image
            source={m.icon}
            style={[
              styles.buttonIcon,
              mode === m.key && styles.buttonIconActive,
            ]}
          />
          <Text
            style={[
              styles.buttonText,
              mode === m.key && styles.buttonTextActive,
            ]}
          >
            {m.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.borderDark,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    gap: 0,
    backgroundColor: colors.backgroundSecondary,
  },
  buttonIcon: {
    width: 64,
    height: 64,
  },
  buttonIconActive: {},
  buttonActive: {
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
  },
  buttonTextActive: {
    color: colors.primary,
  },
});
