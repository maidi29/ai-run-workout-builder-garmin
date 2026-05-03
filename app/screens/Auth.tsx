/**
 * Authentication Screen
 * Launches the Garmin SSO WebView for sign-in.
 */

import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { AppText as Text } from "../../components/AppText";
import { useRouter } from "expo-router";
import { colors, fontSize, fontFamily, sharedStyles } from "../../theme";

export default function AuthScreen() {
  const router = useRouter();

  const handleSignIn = () => {
    router.push("/screens/GarminLoginWebView");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Connect Garmin</Text>
          <Text style={styles.subtitle}>
            Sign in with your Garmin Connect account
          </Text>
        </View>

        <View style={styles.formContainer}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleSignIn}
          >
            <Text style={styles.loginButtonText}>Sign in with Garmin</Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <View style={styles.infoTitleRow}>
              <Image
                source={require("../../assets/lock.png")}
                style={styles.infoTitleIcon}
              />
              <Text style={styles.infoTitle}>Secure sign-in</Text>
            </View>
            <Text style={styles.infoText}>
              You'll sign in directly with Garmin in a secure browser window.
              Your password is never sent to our servers. We use Garmin's
              Connect API (not the official developer API) to create workouts.
            </Text>
          </View>
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
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: fontSize.title,
    fontFamily: fontFamily.bold,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    flex: 1,
  },
  loginButton: {
    ...sharedStyles.primaryButton,
    marginTop: 8,
    marginBottom: 20,
  },
  loginButtonText: sharedStyles.primaryButtonText,
  infoBox: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  infoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  infoTitleIcon: {
    width: 32,
    height: 32,
  },
  infoTitle: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.semibold,
    color: colors.primary,
  },
  infoText: {
    fontSize: fontSize.md,
    color: colors.textInfo,
    lineHeight: 20,
  },
});
