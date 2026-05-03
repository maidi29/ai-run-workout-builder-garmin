import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { AppText as Text } from "../AppText";
import { colors, fontSize, fontFamily } from "../../theme";

interface ImageInputSectionProps {
  selectedImage?: string;
  processing: boolean;
  onPickImage: () => void;
  onClearImage: () => void;
}

export function ImageInputSection({
  selectedImage,
  processing,
  onPickImage,
  onClearImage,
}: ImageInputSectionProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Workout Image</Text>
      {selectedImage ? (
        <View style={styles.imageSelected}>
          <View style={styles.imageSelectedContent}>
            <Image
              source={require("../../assets/checkmark.png")}
              style={styles.imageSelectedIcon}
            />
            <Text style={styles.imageSelectedText}>Image selected</Text>
          </View>
          <TouchableOpacity onPress={onClearImage}>
            <Text style={styles.clearImageLink}>Change image</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.imagePicker}
          onPress={onPickImage}
          disabled={processing}
        >
          <View style={styles.imagePickerContent}>
            <Image
              source={require("../../assets/camera.png")}
              style={styles.imagePickerIcon}
            />
            <Text style={styles.imagePickerText}>Select Image</Text>
          </View>
        </TouchableOpacity>
      )}
      <Text style={styles.helperText}>
        Upload a screenshot or photo of your workout plan
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.semibold,
    color: colors.text,
    marginBottom: 10,
  },
  imagePicker: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.borderDark,
    borderRadius: 8,
    paddingVertical: 24,
    alignItems: "center",
    height: 150,
    justifyContent: "center",
  },
  imagePickerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  imagePickerIcon: {
    width: 54,
    height: 54,
  },
  imagePickerText: {
    fontSize: fontSize.xl,
    color: colors.primary,
    fontFamily: fontFamily.semibold,
  },
  imageSelected: {
    backgroundColor: colors.info,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  imageSelectedContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  imageSelectedIcon: {
    width: 28,
    height: 28,
  },
  imageSelectedText: {
    fontSize: fontSize.base,
    color: colors.primary,
    fontFamily: fontFamily.semibold,
  },
  clearImageLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontFamily: fontFamily.medium,
  },
  helperText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 8,
  },
});
