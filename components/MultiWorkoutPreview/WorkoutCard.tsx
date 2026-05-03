import {
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { AppText as Text } from "../AppText";
import { WorkoutData } from "../../types";
import { colors, fontSize, fontFamily } from "../../theme";
import { formatDurationFromMinutes } from "../../utils/format";

interface WorkoutCardProps {
  workout: WorkoutData;
  index: number;
  status?: "success" | "error" | "pending";
  disabled: boolean;
  onPress: () => void;
}

export function WorkoutCard({
  workout,
  index,
  status,
  disabled,
  onPress,
}: WorkoutCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        status === "success" && styles.cardSuccess,
        status === "error" && styles.cardError,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.index}>#{index + 1}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {workout.name}
          </Text>
        </View>
        {status === "success" && (
          <Image
            source={require("../../assets/checkmark.png")}
            style={[styles.statusBadge, styles.statusSuccess]}
          />
        )}
        {status === "error" && (
          <Image
            source={require("../../assets/xmark.png")}
            style={[styles.statusBadge, styles.statusError]}
          />
        )}
        {status === "pending" && (
          <ActivityIndicator size="small" color={colors.primary} />
        )}
      </View>

      <View style={styles.meta}>
        {workout.duration != null && (
          <Text style={styles.duration}>
            {formatDurationFromMinutes(workout.duration)}
          </Text>
        )}
        {workout.distance != null && workout.distance > 0 && (
          <Text style={styles.distance}>{workout.distance.toFixed(1)} km</Text>
        )}
      </View>

      {workout.exercises && workout.exercises.length > 0 && (
        <Text style={styles.steps}>
          {workout.exercises.length} step
          {workout.exercises.length !== 1 ? "s" : ""}
        </Text>
      )}

      <Text style={styles.editHint}>Tap to review & edit</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderColor: colors.border,
    padding: 16,
    backgroundColor: colors.backgroundSecondary,
  },
  cardSuccess: {
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },
  cardError: {
    borderColor: colors.errorDark,
    backgroundColor: colors.errorCardBg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  index: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bold,
    color: colors.primary,
    overflow: "hidden",
  },
  name: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    width: 20,
    height: 20,
  },
  statusSuccess: {},
  statusError: {},
  meta: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  duration: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  distance: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  steps: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  editHint: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: 6,
    fontFamily: fontFamily.medium,
  },
});
