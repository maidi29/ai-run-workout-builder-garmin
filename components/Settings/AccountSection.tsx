import {
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { AppText as Text } from "../AppText";
import { colors, fontSize, fontFamily } from "../../theme";

interface AccountSectionProps {
  isAuthenticated: boolean;
  loggingOut: boolean;
  onLogout: () => void;
}

export function AccountSection({
  isAuthenticated,
  loggingOut,
  onLogout,
}: AccountSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account</Text>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.label}>Status</Text>
          <View
            style={[
              styles.statusBadge,
              isAuthenticated && styles.statusBadgeActive,
            ]}
          >
            <View style={styles.statusContent}>
              <Image
                source={
                  isAuthenticated
                    ? require("../../assets/connected.png")
                    : require("../../assets/disconnected.png")
                }
                style={styles.statusIcon}
              />
              <Text style={[isAuthenticated && styles.statusTextActive]}>
                {isAuthenticated ? "Connected" : "Disconnected"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          styles.signOutButton,
          loggingOut && styles.disabledButton,
        ]}
        onPress={onLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <ActivityIndicator color={colors.textInverse} size="small" />
        ) : (
          <View style={styles.signOutButtonContent}>
            <Image
              source={require("../../assets/exit.png")}
              style={styles.signOutButtonIcon}
            />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.semibold,
    color: colors.text,
  },
  statusBadge: {
    backgroundColor: colors.statusInactiveBg,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeActive: {
    backgroundColor: colors.statusActiveBg,
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  statusIcon: {
    width: 28,
    height: 28,
  },
  statusText: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontFamily: fontFamily.semibold,
  },
  statusTextActive: {
    color: colors.primary,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  signOutButton: {
    backgroundColor: colors.backgroundSecondary,
  },
  signOutButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  signOutButtonIcon: {
    width: 36,
    height: 36,
  },
  signOutButtonText: {
    color: colors.primary,
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
