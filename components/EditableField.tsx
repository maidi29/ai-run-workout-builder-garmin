import { View, StyleSheet, TextInputProps } from "react-native";
import { AppText as Text, AppTextInput as TextInput } from "./AppText";
import { colors, fontSize, fontFamily } from "../theme";

interface EditableFieldProps {
  label: string;
  value: string | undefined;
  editing: boolean;
  onChangeText: (val: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  inputProps?: TextInputProps;
}

export function EditableField({
  label,
  value,
  editing,
  onChangeText,
  placeholder,
  multiline,
  numberOfLines,
  inputProps,
}: EditableFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {editing ? (
        <TextInput
          style={[styles.input, multiline && styles.textArea]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          multiline={multiline}
          numberOfLines={numberOfLines}
          {...inputProps}
        />
      ) : (
        <Text style={styles.value}>{value || placeholder || "N/A"}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  value: {
    fontSize: fontSize.base,
    color: colors.text,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: fontSize.base,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
});
