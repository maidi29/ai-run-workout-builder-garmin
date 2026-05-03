/**
 * Workout Preview Screen
 * Review and edit workout details before submitting to Garmin
 */

import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import {
  ScrollView,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useWorkout } from "../../hooks/useWorkout";
import { WorkoutData, Exercise } from "../../types";
import { colors, fontSize, fontFamily } from "../../theme";
import { AppText } from "../../components/AppText";
import { formatDateDisplay, getTodayDate } from "../../utils/format";
import { WorkoutDetailsCard } from "../../components/WorkoutPreview/WorkoutDetailsCard";
import { WorkoutStepsSection } from "../../components/WorkoutPreview/WorkoutStepsSection";
import { ScheduleSection } from "../../components/WorkoutPreview/ScheduleSection";
import { ActionButtons } from "../../components/WorkoutPreview/ActionButtons";

export default function WorkoutPreviewScreen() {
  const router = useRouter();
  const { state: authState, logout } = useAuth();
  const accessToken = authState.accessToken;
  const { workoutData: workoutDataParam, fromMultiWorkout } =
    useLocalSearchParams<{
      workoutData: string;
      fromMultiWorkout: string;
    }>();
  const isMultiWorkoutChild = fromMultiWorkout === "true";
  const { submitToBackend, submitAndSchedule } = useWorkout();

  const initialWorkout: WorkoutData = workoutDataParam
    ? JSON.parse(workoutDataParam)
    : {};
  const [workout, setWorkout] = useState<WorkoutData>(initialWorkout);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [scheduleDate, setScheduleDate] = useState(getTodayDate);
  const [showAddPicker, setShowAddPicker] = useState(false);

  useEffect(() => {
    if (!editing) setShowAddPicker(false);
  }, [editing]);

  /* ── Field handlers ── */

  const handleFieldUpdate = <K extends keyof WorkoutData>(
    field: K,
    value: WorkoutData[K],
  ) => {
    setWorkout((prev) => ({ ...prev, [field]: value }));
  };

  const handleExerciseUpdate = (index: number, exercise: Exercise) => {
    const exercises = [...(workout.exercises || [])];
    exercises[index] = exercise;
    handleFieldUpdate("exercises", exercises);
  };

  const handleAddExercise = (typeLabel: string) => {
    const exercises = [...(workout.exercises || [])];
    exercises.push({ name: typeLabel });
    handleFieldUpdate("exercises", exercises);
    setShowAddPicker(false);
  };

  const handleRemoveExercise = (index: number) => {
    const exercises = (workout.exercises || []).filter((_, i) => i !== index);
    handleFieldUpdate("exercises", exercises);
  };

  const handleSetsChange = (index: number, delta: number) => {
    const ex = workout.exercises?.[index];
    if (!ex) return;
    const next = Math.max(1, (ex.sets ?? 1) + delta);
    handleExerciseUpdate(index, { ...ex, sets: next });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (!accessToken) {
        Alert.alert("Error", "Not authenticated. Please log in again.");
        return;
      }

      if (scheduleEnabled) {
        const response = await submitAndSchedule(
          accessToken,
          workout,
          scheduleDate,
        );

        if (response.scheduled) {
          Alert.alert(
            "Success",
            `Workout "${response.workoutName}" created and scheduled for ${formatDateDisplay(scheduleDate)}!`,
            [
              {
                text: "Create Another",
                onPress: () => router.push("/screens/WorkoutInput"),
              },
            ],
          );
        } else {
          Alert.alert(
            "Partially Created",
            `Workout "${response.workoutName}" created, but scheduling failed. You can schedule it manually in Garmin Connect.`,
            [
              {
                text: "Create Another",
                onPress: () => router.push("/screens/WorkoutInput"),
              },
            ],
          );
        }
      } else {
        const response = await submitToBackend(accessToken, workout);

        Alert.alert(
          "Success",
          `Workout "${response.workoutName}" created successfully!`,
          [
            {
              text: "Create Another",
              onPress: () => router.push("/screens/WorkoutInput"),
            },
          ],
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed";
      if (message.includes("401")) {
        await logout();
        Alert.alert("Token Expired", "Please log in again to continue.");
        return;
      }
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const exercises = workout.exercises || [];

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: "Preview",
          headerRight: editing
            ? () => (
                <TouchableOpacity
                  onPress={() => setEditing(false)}
                  style={{
                    padding: 8,
                    marginRight: 4,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Image
                    source={require("../../assets/checkmark.png")}
                    style={{ width: 32, height: 32 }}
                  />
                  <AppText
                    style={{
                      color: colors.primary,
                      fontSize: fontSize.base,
                      fontFamily: fontFamily.semibold,
                    }}
                  >
                    Done
                  </AppText>
                </TouchableOpacity>
              )
            : () => (
                <TouchableOpacity
                  onPress={() => setEditing(true)}
                  style={{
                    padding: 8,
                    marginRight: 4,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 0,
                  }}
                >
                  <Image
                    source={require("../../assets/pencil.png")}
                    style={{ width: 32, height: 32 }}
                  />
                  <AppText
                    style={{
                      color: colors.primary,
                      fontSize: fontSize.base,
                      fontFamily: fontFamily.semibold,
                    }}
                  >
                    Edit
                  </AppText>
                </TouchableOpacity>
              ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <WorkoutDetailsCard
          workout={workout}
          editing={editing}
          onFieldUpdate={handleFieldUpdate}
        />

        <WorkoutStepsSection
          exercises={exercises}
          editing={editing}
          showAddPicker={showAddPicker}
          onExerciseUpdate={handleExerciseUpdate}
          onAddExercise={handleAddExercise}
          onRemoveExercise={handleRemoveExercise}
          onSetsChange={handleSetsChange}
          onToggleAddPicker={() => setShowAddPicker(!showAddPicker)}
        />

        <ScheduleSection
          scheduleEnabled={scheduleEnabled}
          scheduleDate={scheduleDate}
          onToggleSchedule={() => setScheduleEnabled(!scheduleEnabled)}
          onDateChange={setScheduleDate}
        />

        <ActionButtons
          loading={loading}
          isMultiWorkoutChild={isMultiWorkoutChild}
          onBack={() => router.back()}
          onSubmit={handleSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  editHintBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: colors.editHintBg,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.editHintBorder,
    alignItems: "center",
  },
});
