/**
 * Workout Input Screen
 * Allows user to input workout via text or image
 */

import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { AppText as Text } from "../../components/AppText";
import { useRouter, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAI } from "../../hooks/useAI";
import { usePaceSettings } from "../../hooks/usePaceSettings";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { WorkoutData } from "../../types";
import { colors, sharedStyles } from "../../theme";
import { ErrorBox } from "../../components";
import { ModeSelector } from "../../components/WorkoutInput/ModeSelector";
import { TextInputSection } from "../../components/WorkoutInput/TextInputSection";
import { ImageInputSection } from "../../components/WorkoutInput/ImageInputSection";
import { SuggestInputSection } from "../../components/WorkoutInput/SuggestInputSection";

type InputMode = "text" | "image" | "suggest";

export default function WorkoutInputScreen() {
  const router = useRouter();
  const {
    state: aiState,
    generateFromContext,
    processTextMultiple,
    processImageMultiple,
  } = useAI();
  const {
    paceSettings,
    loaded: paceLoaded,
    setThresholdPace: saveThresholdPace,
    setEasyPace: saveEasyPace,
  } = usePaceSettings();

  const [mode, setMode] = useState<InputMode>("text");
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<string>();
  // Suggest mode state
  const [feeling, setFeeling] = useState("");
  const [goal, setGoal] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [thresholdPace, setThresholdPace] = useState("");
  const [easyPace, setEasyPace] = useState("");

  // Speech-to-text dictation
  const {
    isAvailable: speechAvailable,
    isListening,
    liveTranscript,
    toggleDictation,
  } = useSpeechToText(
    useCallback((transcript: string) => {
      setDescription((prev) => {
        const separator = prev.trim() ? "\n" : "";
        return prev + separator + transcript;
      });
    }, []),
  );

  // Pre-fill pace fields from stored settings once loaded
  useEffect(() => {
    if (paceLoaded) {
      if (paceSettings.thresholdPace && !thresholdPace) {
        setThresholdPace(paceSettings.thresholdPace);
      }
      if (paceSettings.easyPace && !easyPace) {
        setEasyPace(paceSettings.easyPace);
      }
    }
  }, [paceLoaded]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setSelectedImage(result.assets[0].base64);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  /**
   * Route an array of workouts: single -> preview, multiple -> multi-preview.
   */
  const routeWorkouts = (workouts: WorkoutData[]) => {
    if (workouts.length === 1) {
      router.push({
        pathname: "/screens/WorkoutPreview",
        params: { workoutData: JSON.stringify(workouts[0]) },
      });
    } else {
      router.push({
        pathname: "/screens/MultiWorkoutPreview",
        params: { workoutsData: JSON.stringify(workouts) },
      });
    }
  };

  const handleProcess = async () => {
    try {
      if (mode === "text") {
        if (!description.trim()) {
          Alert.alert("Error", "Please enter a workout description");
          return;
        }
        const workouts = await processTextMultiple(description);
        routeWorkouts(workouts);
      } else if (mode === "image") {
        if (!selectedImage) {
          Alert.alert("Error", "Please select an image");
          return;
        }
        const workouts = await processImageMultiple(
          selectedImage,
          "image/jpeg",
        );
        routeWorkouts(workouts);
      } else {
        // Suggest mode
        if (!feeling.trim()) {
          Alert.alert("Error", "Please select how you're feeling");
          return;
        }
        if (!goal.trim()) {
          Alert.alert("Error", "Please select a goal");
          return;
        }

        // Persist entered paces for future use
        if (thresholdPace.trim()) saveThresholdPace(thresholdPace.trim());
        if (easyPace.trim()) saveEasyPace(easyPace.trim());

        const result = await generateFromContext({
          feeling,
          goal,
          durationMinutes,
          thresholdPace: thresholdPace.trim() || undefined,
          easyPace: easyPace.trim() || undefined,
        });

        router.push({
          pathname: "/screens/WorkoutPreview",
          params: { workoutData: JSON.stringify(result) },
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Processing failed";
      Alert.alert("Error", message);
    }
  };

  const handleModeChange = (newMode: InputMode) => {
    setMode(newMode);
    if (newMode !== "image") setSelectedImage(undefined);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: "Create" }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ModeSelector mode={mode} onModeChange={handleModeChange} />

        <View style={styles.inputSection}>
          {mode === "text" && (
            <TextInputSection
              description={description}
              onChangeDescription={setDescription}
              processing={aiState.processing}
              speechAvailable={speechAvailable}
              isListening={isListening}
              liveTranscript={liveTranscript}
              onToggleDictation={toggleDictation}
            />
          )}

          {mode === "image" && (
            <ImageInputSection
              selectedImage={selectedImage}
              processing={aiState.processing}
              onPickImage={pickImage}
              onClearImage={() => setSelectedImage(undefined)}
            />
          )}

          {mode === "suggest" && (
            <SuggestInputSection
              feeling={feeling}
              goal={goal}
              durationMinutes={durationMinutes}
              thresholdPace={thresholdPace}
              easyPace={easyPace}
              processing={aiState.processing}
              onFeelingChange={setFeeling}
              onGoalChange={setGoal}
              onDurationChange={setDurationMinutes}
              onThresholdPaceChange={setThresholdPace}
              onEasyPaceChange={setEasyPace}
            />
          )}
        </View>

        {/* Error Display */}
        {aiState.error && (
          <View style={{ marginHorizontal: 16 }}>
            <ErrorBox title="Error" message={aiState.error} />
          </View>
        )}

        {/* Process Button */}
        <TouchableOpacity
          style={[
            styles.processButton,
            aiState.processing && styles.disabledButton,
          ]}
          onPress={handleProcess}
          disabled={aiState.processing}
        >
          {aiState.processing ? (
            <View style={styles.processButtonContent}>
              <ActivityIndicator size="small" color={colors.textInverse} />
              <Text style={styles.processButtonText}>Processing...</Text>
            </View>
          ) : (
            <View style={styles.processButtonContent}>
              <Text style={styles.processButtonText}>
                {mode === "suggest" ? "Generate" : "Process"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
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
  inputSection: {
    paddingHorizontal: 8,
    marginHorizontal: 8,
    marginTop: 20,
    paddingTop: 20,
    borderColor: colors.borderDark,
    borderTopWidth: 1,
  },
  processButton: {
    ...sharedStyles.primaryButton,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  disabledButton: sharedStyles.primaryButtonDisabled,
  processButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  processButtonText: sharedStyles.primaryButtonText,
});
