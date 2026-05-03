import { useState } from "react";
import { View, TouchableOpacity, Alert, StyleSheet, Modal } from "react-native";
import { AppText as Text, AppTextInput as TextInput } from "../AppText";
import { Feather } from "@expo/vector-icons";
import { colors, fontSize, fontFamily } from "../../theme";
import { SettingsSection, SettingsCard } from "./SettingsSection";

interface PaceSettingsSectionProps {
  thresholdPace: string;
  easyPace: string;
  editThreshold: string | null;
  editEasy: string | null;
  onEditThresholdChange: (val: string | null) => void;
  onEditEasyChange: (val: string | null) => void;
  onSaveThreshold: (val: string) => void;
  onSaveEasy: (val: string) => void;
  onClearPaces: () => void;
}

type PaceTopic = "threshold" | "easy";

const PACE_INFO: Record<
  PaceTopic,
  { title: string; description: string; usage: string; example: string }
> = {
  threshold: {
    title: "Threshold pace",
    description:
      "Your comfortably hard pace that you can usually hold for about 45-60 minutes.",
    usage:
      "Used to set tempo and interval intensity when building structured workouts.",
    example:
      "Example: if your threshold pace is 5:00 /km, tempo work is around that pace.",
  },
  easy: {
    title: "Easy pace",
    description:
      "Your conversational pace where breathing stays controlled and relaxed.",
    usage:
      "Used as the baseline for warmups, cooldowns, recovery runs, and easy long-run sections.",
    example:
      "Example: if your easy pace is 6:30 /km, easy runs stay around that effort.",
  },
};

interface PaceInputFieldProps {
  label: string;
  infoTopic: PaceTopic;
  onInfoPress: (topic: PaceTopic) => void;
  placeholder: string;
  value: string;
  editValue: string | null;
  onChangeText: (val: string | null) => void;
  onSave: (val: string) => void;
}

function PaceInputField({
  label,
  infoTopic,
  onInfoPress,
  placeholder,
  value,
  editValue,
  onChangeText,
  onSave,
}: PaceInputFieldProps) {
  return (
    <SettingsCard>
      <View style={styles.cardColumn}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => onInfoPress(infoTopic)}
            accessibilityRole="button"
            accessibilityLabel={`Explain ${label}`}
          >
            <Feather name="info" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.paceInput}
          placeholderTextColor={colors.textMuted}
          placeholder={placeholder}
          value={editValue !== null ? editValue : value}
          onChangeText={(val) => onChangeText(val)}
          onBlur={() => {
            if (editValue !== null) {
              onSave(editValue);
              onChangeText(null);
            }
          }}
        />
      </View>
    </SettingsCard>
  );
}

export function PaceSettingsSection({
  thresholdPace,
  easyPace,
  editThreshold,
  editEasy,
  onEditThresholdChange,
  onEditEasyChange,
  onSaveThreshold,
  onSaveEasy,
  onClearPaces,
}: PaceSettingsSectionProps) {
  const [infoVisible, setInfoVisible] = useState(false);
  const [activeTopic, setActiveTopic] = useState<PaceTopic>("threshold");

  const openInfo = (topic: PaceTopic) => {
    setActiveTopic(topic);
    setInfoVisible(true);
  };

  const closeInfo = () => setInfoVisible(false);

  return (
    <SettingsSection title="Pace Settings">
      <Text style={styles.helperText}>
        Stored paces are used as defaults when generating workouts. Leave empty
        to generate workouts without pace targets.
      </Text>

      <PaceInputField
        label="Threshold pace (min/km)"
        infoTopic="threshold"
        onInfoPress={openInfo}
        placeholder="e.g. 5:00"
        value={thresholdPace}
        editValue={editThreshold}
        onChangeText={onEditThresholdChange}
        onSave={onSaveThreshold}
      />

      <PaceInputField
        label="Easy / current pace (min/km)"
        infoTopic="easy"
        onInfoPress={openInfo}
        placeholder="e.g. 6:30"
        value={easyPace}
        editValue={editEasy}
        onChangeText={onEditEasyChange}
        onSave={onSaveEasy}
      />

      {(thresholdPace || easyPace) && (
        <TouchableOpacity
          style={[styles.button, styles.clearPaceButton]}
          onPress={() => {
            Alert.alert(
              "Clear Paces",
              "Remove stored pace values? Workouts will be generated without pace targets.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Clear",
                  style: "destructive",
                  onPress: onClearPaces,
                },
              ],
            );
          }}
        >
          <Text style={styles.clearPaceButtonText}>Clear Paces</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={infoVisible}
        transparent
        animationType="fade"
        onRequestClose={closeInfo}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {PACE_INFO[activeTopic].title}
            </Text>
            <Text style={styles.modalText}>
              {PACE_INFO[activeTopic].description}
            </Text>
            <Text style={styles.modalText}>{PACE_INFO[activeTopic].usage}</Text>
            <Text style={styles.modalExample}>
              {PACE_INFO[activeTopic].example}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={closeInfo}
              accessibilityRole="button"
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SettingsSection>
  );
}

const styles = StyleSheet.create({
  helperText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: 12,
    lineHeight: 18,
  },
  cardColumn: {
    flexDirection: "column",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.semibold,
    color: colors.text,
  },
  infoButton: {
    padding: 4,
  },
  paceInput: {
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.base,
    color: colors.text,
    marginTop: 6,
    backgroundColor: colors.background,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  clearPaceButton: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  clearPaceButtonText: {
    color: colors.error,
    fontSize: fontSize.base,
    fontFamily: fontFamily.semibold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: 16,
    gap: 8,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  modalText: {
    fontSize: fontSize.base,
    color: colors.text,
    lineHeight: 20,
  },
  modalExample: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  modalButton: {
    alignSelf: "flex-end",
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
  },
});
