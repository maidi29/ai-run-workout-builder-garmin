import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { AppText as Text } from "../AppText";
import { Exercise } from "../../types";
import { colors, fontSize, fontFamily } from "../../theme";
import { formatPaceRangeDisplay } from "../../utils/pace";
import { formatDurationFromSeconds } from "../../utils/format";
import { computeWorkoutTotals } from "../../utils/workoutTotals";
import { STEP_BAR_COLORS, STEP_TYPES } from "./constants";
import { getStepType } from "./helpers";
import { StepCardContent } from "./StepCardContent";
import { RestEditContent, RestDisplayContent } from "./RestContent";

interface WorkoutStepsSectionProps {
  exercises: Exercise[];
  editing: boolean;
  showAddPicker: boolean;
  onExerciseUpdate: (index: number, exercise: Exercise) => void;
  onAddExercise: (typeLabel: string) => void;
  onRemoveExercise: (index: number) => void;
  onSetsChange: (index: number, delta: number) => void;
  onToggleAddPicker: () => void;
}

export function WorkoutStepsSection({
  exercises,
  editing,
  showAddPicker,
  onExerciseUpdate,
  onAddExercise,
  onRemoveExercise,
  onSetsChange,
}: WorkoutStepsSectionProps) {
  const exerciseCount = exercises.length;

  if (exerciseCount === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Workout Steps</Text>
          {(() => {
            const { totalDurationSec, totalDistanceKm } =
              computeWorkoutTotals(exercises);
            const hasDur = totalDurationSec != null && totalDurationSec > 0;
            const hasDist = totalDistanceKm != null && totalDistanceKm > 0;
            if (hasDur || hasDist) {
              const parts: string[] = [];
              if (hasDur)
                parts.push(formatDurationFromSeconds(totalDurationSec!));
              if (hasDist) parts.push(`${totalDistanceKm!.toFixed(2)} km`);
              return (
                <Text style={styles.totalsSummary}>
                  Total: {parts.join(" • ")}
                </Text>
              );
            }
            return null;
          })()}
        </View>
      </View>

      {/* Step type picker */}
      {showAddPicker && (
        <View style={styles.stepTypePicker}>
          <Text style={styles.stepTypePickerLabel}>Select step type:</Text>
          <View style={styles.stepTypeChips}>
            {STEP_TYPES.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.stepTypeChip,
                  {
                    borderColor:
                      STEP_BAR_COLORS[type.key] || STEP_BAR_COLORS.interval,
                  },
                ]}
                onPress={() => onAddExercise(type.label)}
              >
                <View
                  style={[
                    styles.stepTypeChipDot,
                    {
                      backgroundColor:
                        STEP_BAR_COLORS[type.key] || STEP_BAR_COLORS.interval,
                    },
                  ]}
                />
                <Text style={styles.stepTypeChipText}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Exercise list */}
      {exercises.map((exercise, index) => {
        const stepType = getStepType(exercise);
        const barColor = STEP_BAR_COLORS[stepType] || STEP_BAR_COLORS.interval;
        const hasReps = (exercise.sets ?? 0) > 1;
        const paceRangeStr = exercise.pace
          ? formatPaceRangeDisplay(exercise.pace)
          : null;

        if (hasReps) {
          return (
            <View key={`step-${index}`} style={styles.stepRow}>
              <View style={[styles.repeatBlock, { flex: 1 }]}>
                {/* Reps header */}
                <View style={styles.repeatHeader}>
                  <Feather
                    name="refresh-cw"
                    size={20}
                    color={colors.textSecondary}
                    style={styles.repeatIcon}
                  />
                  <Text style={styles.repeatLabel}>Reps</Text>
                  <View style={styles.repsStepper}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => onSetsChange(index, -1)}
                      disabled={(exercise.sets ?? 1) <= 1}
                    >
                      <Text style={styles.stepperText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.repsValue}>{exercise.sets ?? 1}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => onSetsChange(index, 1)}
                    >
                      <Text style={styles.stepperText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Run sub-card */}
                <View
                  style={[
                    styles.repeatSubCard,
                    { borderLeftColor: STEP_BAR_COLORS.interval },
                  ]}
                >
                  <Text style={styles.repeatElementLabel}>Run</Text>
                  <View style={styles.repeatElementContent}>
                    <StepCardContent
                      exercise={exercise}
                      editing={editing}
                      onUpdate={(ex) => onExerciseUpdate(index, ex)}
                      onRemove={() => onRemoveExercise(index)}
                      paceRangeStr={paceRangeStr}
                    />
                  </View>
                </View>

                {/* Rest sub-card */}
                <View
                  style={[
                    styles.repeatSubCard,
                    { borderLeftColor: STEP_BAR_COLORS.rest },
                  ]}
                >
                  <Text style={styles.repeatElementLabel}>Rest</Text>
                  <View style={styles.repeatElementContent}>
                    {editing ? (
                      <RestEditContent
                        exercise={exercise}
                        onUpdate={(ex) => onExerciseUpdate(index, ex)}
                      />
                    ) : (
                      <RestDisplayContent exercise={exercise} />
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        }

        return (
          <View key={`step-${index}`} style={styles.stepRow}>
            <View
              style={[styles.stepCard, { borderLeftColor: barColor, flex: 1 }]}
            >
              <StepCardContent
                exercise={exercise}
                editing={editing}
                onUpdate={(ex) => onExerciseUpdate(index, ex)}
                onRemove={() => onRemoveExercise(index)}
                paceRangeStr={paceRangeStr}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  totalsSummary: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 4,
  },
  stepTypePicker: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.info,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.infoSecondaryBorder,
  },
  stepTypePickerLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  stepTypeChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stepTypeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: colors.background,
  },
  stepTypeChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  stepTypeChipText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    color: colors.text,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 12,
  },
  stepCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  repeatBlock: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  repeatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 8,
  },
  repeatIcon: {
    marginRight: 8,
  },
  repeatLabel: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginRight: 8,
  },
  repsStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperText: {
    fontSize: 18,
    fontFamily: fontFamily.semibold,
    color: colors.text,
  },
  repsValue: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.text,
    minWidth: 28,
    textAlign: "center",
  },
  repeatSubCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  repeatElementLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  repeatElementContent: {
    paddingLeft: 0,
  },
});
