import {
  View,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
} from "react-native";
import { AppText as Text } from "../AppText";
import { colors, fontSize, fontFamily } from "../../theme";

interface TextInputSectionProps {
  description: string;
  onChangeDescription: (text: string) => void;
  processing: boolean;
  speechAvailable: boolean;
  isListening: boolean;
  liveTranscript: string;
  onToggleDictation: () => void;
}

export function TextInputSection({
  description,
  onChangeDescription,
  processing,
  speechAvailable,
  isListening,
  liveTranscript,
  onToggleDictation,
}: TextInputSectionProps) {
  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { marginBottom: 0 }]}>
          Workout Description
        </Text>
        {speechAvailable && (
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={onToggleDictation}
            disabled={processing}
            activeOpacity={0.7}
          >
            <Image
              source={
                isListening
                  ? require("../../assets/stop.png")
                  : require("../../assets/microphone.png")
              }
              style={styles.micButtonIcon}
            />
            <Text
              style={[
                styles.micButtonLabel,
                isListening && styles.micButtonLabelActive,
              ]}
            >
              {isListening ? "Stop" : "Dictate"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <TextInput
        style={[styles.textInput, isListening && styles.textInputListening]}
        placeholderTextColor={colors.textMuted}
        value={
          isListening && liveTranscript
            ? description + (description.trim() ? "\n" : "") + liveTranscript
            : description
        }
        onChangeText={onChangeDescription}
        editable={!processing && !isListening}
        multiline
        numberOfLines={15}
      />
      {isListening ? (
        <View style={styles.listeningBar}>
          <View style={styles.listeningDot} />
          <Text style={styles.listeningText}>Listening...</Text>
        </View>
      ) : (
        <Text style={styles.helperText}>
          Describe your workout in plain text or use the Dictate button to speak
          it
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.semibold,
    color: colors.text,
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  micButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.backgroundSecondary,
  },
  micButtonActive: {
    borderColor: colors.listening,
  },
  micButtonIcon: {
    width: 32,
    height: 32,
  },
  micButtonLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
  },
  micButtonLabelActive: {},
  textInput: {
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.base,
    color: colors.text,
    textAlignVertical: "top",
    height: 150,
  },
  textInputListening: {
    borderColor: colors.listening,
    borderWidth: 2,
  },
  listeningBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.listening,
  },
  helperText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 8,
  },
  listeningText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.listening,
    fontStyle: "italic",
  },
});
