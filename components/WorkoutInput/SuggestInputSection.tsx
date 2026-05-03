import { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Image, Modal } from "react-native";
import { AppText as Text, AppTextInput as TextInput } from "../AppText";
import Slider from "@react-native-community/slider";
import { Feather } from "@expo/vector-icons";
import { colors, fontSize, fontFamily, fontWeight } from "../../theme";

const FEELING_CHIPS: { image: ReturnType<typeof require>; label: string }[] = [
  { image: require("../../assets/sore-trans.png"), label: "Sore" },
  { image: require("../../assets/tired-trans.png"), label: "Tired" },
  { image: require("../../assets/normal-trans.png"), label: "Normal" },
  { image: require("../../assets/fresh-trans.png"), label: "Fresh" },
  { image: require("../../assets/energized-trans.png"), label: "Energized" },
];

const GOAL_CHIPS = [
  "Easy run",
  "Recovery",
  "Tempo",
  "Intervals",
  "Long run",
  "Progression",
];

const DURATION_MIN = 15;
const DURATION_MAX = 180;
const DURATION_STEP = 5;
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
      "Example: if your threshold pace is 4:45 /km, tempo work is around that pace.",
  },
  easy: {
    title: "Easy pace",
    description:
      "Your conversational pace where breathing stays controlled and relaxed.",
    usage:
      "Used as the baseline for warmups, cooldowns, recovery runs, and easy long-run sections.",
    example:
      "Example: if your easy pace is 5:45 /km, easy runs stay around that effort.",
  },
};

interface SuggestInputSectionProps {
  feeling: string;
  goal: string;
  durationMinutes: number;
  thresholdPace: string;
  easyPace: string;
  processing: boolean;
  onFeelingChange: (feeling: string) => void;
  onGoalChange: (goal: string) => void;
  onDurationChange: (minutes: number) => void;
  onThresholdPaceChange: (pace: string) => void;
  onEasyPaceChange: (pace: string) => void;
}

export function SuggestInputSection({
  feeling,
  goal,
  durationMinutes,
  thresholdPace,
  easyPace,
  processing,
  onFeelingChange,
  onGoalChange,
  onDurationChange,
  onThresholdPaceChange,
  onEasyPaceChange,
}: SuggestInputSectionProps) {
  const [infoVisible, setInfoVisible] = useState(false);
  const [activeTopic, setActiveTopic] = useState<PaceTopic>("threshold");

  const openInfo = (topic: PaceTopic) => {
    setActiveTopic(topic);
    setInfoVisible(true);
  };

  const closeInfo = () => setInfoVisible(false);

  return (
    <View style={styles.inputGroup}>
      {/* Feeling */}
      <Text style={styles.label}>How are you feeling?</Text>
      <View style={styles.chipRow}>
        {FEELING_CHIPS.map((chip) => (
          <TouchableOpacity
            key={chip.label}
            style={[
              styles.chip,
              styles.emojiChip,
              feeling === chip.label && styles.chipActive,
            ]}
            onPress={() => onFeelingChange(chip.label)}
          >
            <Image source={chip.image} style={styles.emojiChipIcon} />
            <Text
              style={[
                styles.chipText,
                styles.emojiChipText,
                styles.emojiChip,
                feeling === chip.label && styles.chipTextActive,
              ]}
            >
              {chip.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Goal */}
      <Text style={[styles.label, { marginTop: 16 }]}>Today's goal</Text>
      <View style={styles.chipRow}>
        {GOAL_CHIPS.map((chip) => (
          <TouchableOpacity
            key={chip}
            style={[styles.chip, goal === chip && styles.chipActive]}
            onPress={() => onGoalChange(chip)}
          >
            <Text
              style={[styles.chipText, goal === chip && styles.chipTextActive]}
            >
              {chip}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Duration Slider */}
      <Text style={[styles.label, { marginTop: 16 }]}>
        I have <Text style={styles.durationMinutes}>~{durationMinutes}</Text>{" "}
        minutes today
      </Text>
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderBound}>{DURATION_MIN}</Text>
        <Slider
          style={styles.slider}
          minimumValue={DURATION_MIN}
          maximumValue={DURATION_MAX}
          step={DURATION_STEP}
          value={durationMinutes}
          onValueChange={onDurationChange}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.borderDark}
          thumbTintColor={colors.primary}
        />
        <Text style={styles.sliderBound}>{DURATION_MAX}</Text>
      </View>

      {/* Threshold Pace */}
      <View style={[styles.labelRow, { marginTop: 16 }]}>
        <Text style={styles.label}>Threshold pace (optional)</Text>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => openInfo("threshold")}
          accessibilityRole="button"
          accessibilityLabel="Explain threshold pace"
        >
          <Feather name="info" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.paceInput}
        placeholderTextColor={colors.textMuted}
        placeholder="e.g. 5:00"
        value={thresholdPace}
        onChangeText={onThresholdPaceChange}
        editable={!processing}
      />

      {/* Easy Pace */}
      <View style={[styles.labelRow, { marginTop: 12 }]}>
        <Text style={styles.label}>Easy pace (optional)</Text>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => openInfo("easy")}
          accessibilityRole="button"
          accessibilityLabel="Explain easy pace"
        >
          <Feather name="info" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.paceInput}
        placeholderTextColor={colors.textMuted}
        placeholder="e.g. 6:30"
        value={easyPace}
        onChangeText={onEasyPaceChange}
        editable={!processing}
      />

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
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoButton: {
    padding: 4,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.borderDark,
    backgroundColor: colors.backgroundSecondary,
  },
  emojiChip: {
    flex: 1,
    minWidth: 0,
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: 3,
    borderRadius: 14,
  },
  emojiChipText: {
    fontSize: fontSize.xxs,
    marginTop: -12,
  },
  emojiChipIcon: {
    width: 58,
    height: 58,
    marginBottom: 4,
  },
  chipActive: {
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
    textAlign: "center",
  },
  chipTextActive: {
    color: colors.primary,
  },
  paceInput: {
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.base,
    color: colors.text,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  slider: {
    flex: 1,
    height: 10,
  },
  sliderBound: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontFamily: fontFamily.medium,
    textAlign: "center",
  },
  durationMinutes: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
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
