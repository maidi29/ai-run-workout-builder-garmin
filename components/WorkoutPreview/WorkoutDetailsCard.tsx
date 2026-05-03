import { View, StyleSheet } from "react-native";
import { AppText as Text } from "../AppText";
import { EditableField } from "../EditableField";
import { WorkoutData } from "../../types";
import { colors, fontSize, fontFamily } from "../../theme";

interface WorkoutDetailsCardProps {
  workout: WorkoutData;
  editing: boolean;
  onFieldUpdate: <K extends keyof WorkoutData>(
    field: K,
    value: WorkoutData[K],
  ) => void;
}

export function WorkoutDetailsCard({
  workout,
  editing,
  onFieldUpdate,
}: WorkoutDetailsCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Workout Details</Text>
      </View>

      <EditableField
        label="Name"
        value={workout.name}
        editing={editing}
        onChangeText={(val) => onFieldUpdate("name", val)}
      />

      <EditableField
        label="Description"
        value={workout.description}
        editing={editing}
        onChangeText={(val) => onFieldUpdate("description", val)}
        placeholder="N/A"
        multiline
        numberOfLines={3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderColor: colors.border,
    padding: 16,
    backgroundColor: colors.backgroundSecondary,
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
});
