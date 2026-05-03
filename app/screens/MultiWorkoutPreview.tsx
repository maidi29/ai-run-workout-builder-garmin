/**
 * Multi-Workout Preview Screen
 * Lists multiple workouts extracted from a pasted text.
 * Each can be tapped to open the single WorkoutPreviewScreen.
 * "Push All" submits each in sequence.
 */

import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { AppText as Text } from "../../components/AppText";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useWorkout } from "../../hooks/useWorkout";
import { WorkoutData } from "../../types";
import { colors, fontSize, fontFamily, sharedStyles } from "../../theme";
import { WorkoutCard } from "../../components/MultiWorkoutPreview/WorkoutCard";

export default function MultiWorkoutPreviewScreen() {
  const router = useRouter();
  const { state: authState, logout } = useAuth();
  const accessToken = authState.accessToken;
  const { submitToBackend } = useWorkout();

  const { workoutsData: workoutsParam } = useLocalSearchParams<{
    workoutsData: string;
  }>();

  const initialWorkouts: WorkoutData[] = workoutsParam
    ? JSON.parse(workoutsParam)
    : [];
  const [workouts] = useState<WorkoutData[]>(initialWorkouts);
  const [pushingAll, setPushingAll] = useState(false);
  const [pushResults, setPushResults] = useState<
    Record<number, "success" | "error" | "pending">
  >({});

  const handleEditWorkout = (index: number) => {
    router.push({
      pathname: "/screens/WorkoutPreview",
      params: {
        workoutData: JSON.stringify(workouts[index]),
        fromMultiWorkout: "true",
      },
    });
  };

  const handlePushAll = useCallback(async () => {
    if (!accessToken) {
      Alert.alert("Error", "Not authenticated. Please log in again.");
      return;
    }

    Alert.alert(
      "Push All Workouts",
      `Create ${workouts.length} workouts in Garmin Connect?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Push All",
          onPress: async () => {
            setPushingAll(true);
            const results: Record<number, "success" | "error"> = {};
            let successCount = 0;

            for (let i = 0; i < workouts.length; i++) {
              setPushResults((prev) => ({ ...prev, [i]: "pending" }));
              try {
                await submitToBackend(accessToken, workouts[i]);
                results[i] = "success";
                successCount++;
              } catch (err) {
                results[i] = "error";
                const msg = err instanceof Error ? err.message : "Failed";
                console.warn(
                  `[MultiWorkout] Failed to push workout ${i}:`,
                  msg,
                );

                // Token expired - stop
                if (msg.includes("401")) {
                  await logout();
                  Alert.alert(
                    "Token Expired",
                    "Please log in again to continue.",
                  );
                  setPushingAll(false);
                  return;
                }
              }
              setPushResults((prev) => ({ ...prev, [i]: results[i] }));
            }

            setPushingAll(false);

            const failCount = workouts.length - successCount;
            if (failCount === 0) {
              Alert.alert("Success", `All ${successCount} workouts created!`, [
                {
                  text: "Create More",
                  onPress: () => router.push("/screens/WorkoutInput"),
                },
              ]);
            } else {
              Alert.alert(
                "Partial Success",
                `${successCount} created, ${failCount} failed.`,
              );
            }
          },
        },
      ],
    );
  }, [accessToken, workouts, submitToBackend, logout, router]);

  if (workouts.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No workouts detected</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: "Workouts" }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {workouts.length} workouts detected
          </Text>
        </View>

        {workouts.map((workout, index) => (
          <WorkoutCard
            key={index}
            workout={workout}
            index={index}
            status={pushResults[index]}
            disabled={pushingAll}
            onPress={() => handleEditWorkout(index)}
          />
        ))}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.cancelBtn,
              pushingAll && sharedStyles.primaryButtonDisabled,
            ]}
            onPress={() => router.back()}
            disabled={pushingAll}
          >
            <Text style={sharedStyles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pushAllBtn,
              pushingAll && sharedStyles.primaryButtonDisabled,
            ]}
            onPress={handlePushAll}
            disabled={pushingAll}
          >
            {pushingAll ? (
              <ActivityIndicator color={colors.textInverse} size="small" />
            ) : (
              <Text style={sharedStyles.primaryButtonText}>
                Push All ({workouts.length})
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
  summaryRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  summaryText: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  backButtonText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    fontFamily: fontFamily.semibold,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  cancelBtn: {
    ...sharedStyles.secondaryButton,
    flex: 1,
  },
  pushAllBtn: {
    ...sharedStyles.primaryButton,
    flex: 1,
  },
});
