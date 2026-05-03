/**
 * Settings Screen
 * Account settings and app configuration
 */

import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import {
  View,
  ScrollView,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { AppText as Text } from "../../components/AppText";
import { useRouter, Stack } from "expo-router";
import { SvgXml } from "react-native-svg";
import { useAuth } from "../../hooks/useAuth";
import { usePaceSettings } from "../../hooks/usePaceSettings";
import { colors, fontSize, fontFamily } from "../../theme";
import { AccountSection } from "../../components/Settings/AccountSection";
import { PaceSettingsSection } from "../../components/Settings/PaceSettingsSection";
import { SettingsSection, SettingsCard } from "../../components/Settings/SettingsSection";
import { BMC_LOGO_SVG } from "../../components/Settings/bmcLogo";

export default function SettingsScreen() {
  const router = useRouter();
  const { state: authState, logout } = useAuth();
  const { paceSettings, setThresholdPace, setEasyPace } = usePaceSettings();
  const [loggingOut, setLoggingOut] = useState(false);

  // Local editing state for pace fields
  const [editThreshold, setEditThreshold] = useState<string | null>(null);
  const [editEasy, setEditEasy] = useState<string | null>(null);

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Sign Out",
        onPress: async () => {
          try {
            setLoggingOut(true);
            await logout();
            router.push("/screens/Auth");
          } catch {
            Alert.alert("Error", "Failed to sign out. Please try again.");
          } finally {
            setLoggingOut(false);
          }
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: "Settings" }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AccountSection
          isAuthenticated={authState.isAuthenticated}
          loggingOut={loggingOut}
          onLogout={handleLogout}
        />

        <PaceSettingsSection
          thresholdPace={paceSettings.thresholdPace}
          easyPace={paceSettings.easyPace}
          editThreshold={editThreshold}
          editEasy={editEasy}
          onEditThresholdChange={setEditThreshold}
          onEditEasyChange={setEditEasy}
          onSaveThreshold={setThresholdPace}
          onSaveEasy={setEasyPace}
          onClearPaces={() => {
            setThresholdPace("");
            setEasyPace("");
            setEditThreshold(null);
            setEditEasy(null);
          }}
        />

        <SettingsSection title="Support">
          <SettingsCard style={styles.supportCard}>
            <Text style={styles.supportText}>
              Enjoying the app? Help cover AI and server costs by buying me a
              donut!
            </Text>
            <TouchableOpacity
              style={styles.bmcButton}
              onPress={() => Linking.openURL("https://buymeacoffee.com/maidi")}
              activeOpacity={0.8}
            >
              <SvgXml xml={BMC_LOGO_SVG} width={160} height={35} />
            </TouchableOpacity>
          </SettingsCard>
        </SettingsSection>

        <SettingsSection title="Data">
          <SettingsCard>
            <View style={styles.cardRow}>
              <View>
                <Text style={styles.label}>App Version</Text>
                <Text style={styles.sublabel}>Build info</Text>
              </View>
              <Text style={styles.value}>1.0.0</Text>
            </View>
          </SettingsCard>
        </SettingsSection>
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
  sublabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  value: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
  },
  supportCard: {
    paddingVertical: 16,
    alignItems: "center",
    gap: 14,
  },
  supportText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: "left",
    lineHeight: 20,
  },
  bmcButton: {
    backgroundColor: "#FFDD00",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
});
