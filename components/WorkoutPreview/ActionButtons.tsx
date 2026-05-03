import {
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { AppText as Text } from "../AppText";
import { colors, fontSize, fontFamily, sharedStyles } from "../../theme";

interface ActionButtonsProps {
  loading: boolean;
  isMultiWorkoutChild: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

export function ActionButtons({
  loading,
  isMultiWorkoutChild,
  onBack,
  onSubmit,
}: ActionButtonsProps) {
  return (
    <View style={styles.actions}>
      {/* {!isMultiWorkoutChild && (
        <TouchableOpacity
          style={[styles.cancelButton, loading && styles.disabledButton]}
          onPress={onBack}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
      )} */}

      {isMultiWorkoutChild ? (
        <TouchableOpacity style={styles.submitButton} onPress={onBack}>
          <Text style={styles.submitButtonText}>Back to All Workouts</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <View style={styles.submitButtonContent}>
              <Image
                source={require("../../assets/checkmark.png")}
                style={styles.submitButtonIcon}
              />
              <Text style={styles.submitButtonText}>Create Workout</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderDark,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
  },
  submitButton: {
    ...sharedStyles.primaryButton,
    flex: 1,
  },
  submitButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitButtonIcon: {
    width: 32,
    height: 32,
    tintColor: colors.textInverse,
  },
  submitButtonText: sharedStyles.primaryButtonText,
  disabledButton: sharedStyles.primaryButtonDisabled,
});
