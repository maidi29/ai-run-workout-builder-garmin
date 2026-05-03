import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { AppText as Text } from "../AppText";
import { Exercise } from "../../types";
import { ValueStepper, ModeToggle } from "../../components";
import { colors, fontSize, fontFamily } from "../../theme";
import { formatDuration, formatDistanceDisplay } from "../../utils/format";
import { adjustPace } from "../../utils/pace";

interface StepCardContentProps {
  exercise: Exercise;
  editing: boolean;
  onUpdate: (ex: Exercise) => void;
  onRemove: () => void;
  paceRangeStr: string | null;
}

export function StepCardContent({
  exercise,
  editing,
  onUpdate,
  onRemove,
  paceRangeStr,
}: StepCardContentProps) {
  const hasDuration = exercise.duration != null && exercise.duration > 0;
  const hasDistance = exercise.distance != null && exercise.distance > 0;
  const isDurationMode = hasDuration || !hasDistance;

  return (
    <>
      {/* Name (read-only) + remove */}
      <View style={styles.stepHeader}>
        <Text style={styles.stepName}>{exercise.name}</Text>
        {editing && (
          <TouchableOpacity onPress={onRemove}>
            <Image
              source={require("../../assets/remove.png")}
              style={styles.removeButton}
            />
          </TouchableOpacity>
        )}
      </View>

      {editing ? (
        <View style={styles.editFields}>
          {/* Time / Distance toggle */}
          <ModeToggle
            options={["Time", "Distance"]}
            activeIndex={isDurationMode ? 0 : 1}
            onToggle={(i) => {
              if (i === 0 && !isDurationMode) {
                onUpdate({
                  ...exercise,
                  duration: exercise.duration || 300,
                  distance: undefined,
                });
              } else if (i === 1 && isDurationMode) {
                onUpdate({
                  ...exercise,
                  distance: exercise.distance || 1.0,
                  duration: undefined,
                });
              }
            }}
          />

          {/* Duration stepper */}
          {isDurationMode && (
            <ValueStepper
              label="Duration"
              displayValue={
                exercise.duration ? formatDuration(exercise.duration) : "0:00"
              }
              onIncrement={() =>
                onUpdate({
                  ...exercise,
                  duration: (exercise.duration || 0) + 30,
                })
              }
              onDecrement={() =>
                onUpdate({
                  ...exercise,
                  duration: Math.max(30, (exercise.duration || 60) - 30),
                })
              }
              decrementDisabled={(exercise.duration || 0) <= 30}
            />
          )}

          {/* Distance stepper */}
          {!isDurationMode && (
            <ValueStepper
              label="Distance"
              displayValue={
                exercise.distance
                  ? formatDistanceDisplay(exercise.distance)
                  : "0 m"
              }
              onIncrement={() =>
                onUpdate({
                  ...exercise,
                  distance:
                    Math.round(((exercise.distance || 0) + 0.1) * 10) / 10,
                })
              }
              onDecrement={() =>
                onUpdate({
                  ...exercise,
                  distance: Math.max(
                    0.1,
                    Math.round(((exercise.distance || 0.2) - 0.1) * 10) / 10,
                  ),
                })
              }
              decrementDisabled={(exercise.distance || 0) <= 0.1}
            />
          )}

          {/* Pace stepper */}
          <ValueStepper
            label="Pace"
            displayValue={
              exercise.pace
                ? `${exercise.pace.replace(/\s*\/km$/i, "")} /km`
                : "-- /km"
            }
            onIncrement={() =>
              onUpdate({ ...exercise, pace: adjustPace(exercise.pace, -5) })
            }
            onDecrement={() =>
              onUpdate({ ...exercise, pace: adjustPace(exercise.pace, 5) })
            }
          />
        </View>
      ) : (
        <View style={styles.stepDetails}>
          {exercise.duration != null && (
            <Text style={styles.stepDetail}>
              {formatDuration(exercise.duration)} Total time
            </Text>
          )}
          {exercise.distance != null && exercise.distance > 0 && (
            <Text style={styles.stepDetail}>
              {formatDistanceDisplay(exercise.distance)} Total distance
            </Text>
          )}
          {exercise.pace && (
            <>
              {/progression/i.test(exercise.name) && paceRangeStr ? (
                <Text style={styles.stepPace}>
                  Gradual increase from{" "}
                  {(() => {
                    const clean = paceRangeStr
                      .replace(/^\(/, "")
                      .replace(/\)$/, "");
                    const match = clean.match(/^(.+)-(.+)\s+\/km$/);
                    return match
                      ? `${match[2]} to ${match[1]} /km`
                      : clean.replace("-", " to ");
                  })()}
                </Text>
              ) : (
                <>
                  <Text style={styles.stepPace}>
                    {exercise.pace.replace(/\s*\/km$/i, "")} /km
                  </Text>
                  {paceRangeStr && (
                    <Text style={styles.stepPaceRange}>
                      {paceRangeStr} Intensity goal
                    </Text>
                  )}
                </>
              )}
            </>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stepName: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.text,
    flex: 1,
  },
  removeButton: {
    width: 32,
    height: 32,
  },
  editFields: {
    gap: 10,
  },
  stepDetails: {
    gap: 4,
  },
  stepDetail: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stepPace: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.semibold,
    color: colors.text,
    marginTop: 4,
  },
  stepPaceRange: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
