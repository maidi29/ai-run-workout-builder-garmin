import { View, StyleSheet } from "react-native";
import { AppText as Text } from "../AppText";
import { Exercise } from "../../types";
import { ValueStepper, ModeToggle } from "../../components";
import { colors, fontSize } from "../../theme";
import { formatDuration, formatDistanceDisplay } from "../../utils/format";
import { adjustPace } from "../../utils/pace";

/* ── Rest Edit (stepper controls) ── */

interface RestEditContentProps {
  exercise: Exercise;
  onUpdate: (ex: Exercise) => void;
}

export function RestEditContent({ exercise, onUpdate }: RestEditContentProps) {
  const hasRestTime =
    exercise.restBetweenSets != null && exercise.restBetweenSets > 0;
  const hasRestDist =
    exercise.restDistance != null && exercise.restDistance > 0;
  const isTimeMode = hasRestTime || !hasRestDist;

  return (
    <View style={styles.editFields}>
      <ModeToggle
        options={["Time", "Distance"]}
        activeIndex={isTimeMode ? 0 : 1}
        onToggle={(i) => {
          if (i === 0 && !isTimeMode) {
            onUpdate({
              ...exercise,
              restBetweenSets: exercise.restBetweenSets || 60,
              restDistance: undefined,
            });
          } else if (i === 1 && isTimeMode) {
            onUpdate({
              ...exercise,
              restDistance: exercise.restDistance || 0.4,
              restBetweenSets: undefined,
            });
          }
        }}
      />

      {isTimeMode ? (
        <ValueStepper
          label="Rest"
          displayValue={
            exercise.restBetweenSets
              ? formatDuration(exercise.restBetweenSets)
              : "0:00"
          }
          onIncrement={() =>
            onUpdate({
              ...exercise,
              restBetweenSets: (exercise.restBetweenSets || 0) + 15,
            })
          }
          onDecrement={() =>
            onUpdate({
              ...exercise,
              restBetweenSets: Math.max(
                15,
                (exercise.restBetweenSets || 30) - 15,
              ),
            })
          }
          decrementDisabled={(exercise.restBetweenSets || 0) <= 15}
        />
      ) : (
        <ValueStepper
          label="Distance"
          displayValue={
            exercise.restDistance
              ? formatDistanceDisplay(exercise.restDistance)
              : "0 m"
          }
          onIncrement={() =>
            onUpdate({
              ...exercise,
              restDistance:
                Math.round(((exercise.restDistance || 0) + 0.1) * 10) / 10,
            })
          }
          onDecrement={() =>
            onUpdate({
              ...exercise,
              restDistance: Math.max(
                0.1,
                Math.round(((exercise.restDistance || 0.2) - 0.1) * 10) / 10,
              ),
            })
          }
          decrementDisabled={(exercise.restDistance || 0) <= 0.1}
        />
      )}

      {/* Pace stepper */}
      <ValueStepper
        label="Pace"
        displayValue={
          exercise.restPace
            ? `${exercise.restPace.replace(/\s*\/km$/i, "")} /km`
            : "-- /km"
        }
        onIncrement={() =>
          onUpdate({
            ...exercise,
            restPace: adjustPace(exercise.restPace, -5),
          })
        }
        onDecrement={() =>
          onUpdate({
            ...exercise,
            restPace: adjustPace(exercise.restPace, 5),
          })
        }
      />
    </View>
  );
}

/* ── Rest Display (read-only) ── */

interface RestDisplayContentProps {
  exercise: Exercise;
}

export function RestDisplayContent({ exercise }: RestDisplayContentProps) {
  if (exercise.restDistance != null && exercise.restDistance > 0) {
    return (
      <Text style={styles.stepDetail}>
        {formatDistanceDisplay(exercise.restDistance)}
        {exercise.restPace && (
          <Text> @ {exercise.restPace.replace(/\s*\/km$/i, "")} /km</Text>
        )}
      </Text>
    );
  }
  if (exercise.restBetweenSets != null && exercise.restBetweenSets > 0) {
    return (
      <Text style={styles.stepDetail}>
        {formatDuration(exercise.restBetweenSets)} Rest
        {exercise.restPace && (
          <Text> @ {exercise.restPace.replace(/\s*\/km$/i, "")} /km</Text>
        )}
      </Text>
    );
  }
  return <Text style={[styles.stepDetail, styles.placeholder]}>No rest</Text>;
}

const styles = StyleSheet.create({
  editFields: {
    gap: 10,
  },
  stepDetail: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  placeholder: {
    color: colors.textMuted,
    fontStyle: "italic",
  },
});
