/**
 * Root layout for Expo Router
 * Conditional routing based on authentication state
 */

import { useEffect } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { PaceSettingsProvider } from "../hooks/usePaceSettings";
import { colors, fontFamily } from "../theme";

function SettingsHeaderButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push("/screens/Settings")}
      style={{ padding: 8, marginRight: 4 }}
      accessibilityLabel="Settings"
    >
      <Feather name="settings" size={24} color={colors.text} />
    </TouchableOpacity>
  );
}

function BackButton() {
  const router = useRouter();
  if (!router.canGoBack()) return null;
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      style={{ padding: 8, marginLeft: 4 }}
      accessibilityLabel="Back"
    >
      <Feather name="arrow-left" size={24} color={colors.text} />
    </TouchableOpacity>
  );
}

function RootLayoutNav() {
  const { state: authState, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const segmentsArr = (segments || []) as string[];
    const preAuthScreens = ["Auth", "GarminLoginWebView"];
    const onPreAuthScreen =
      preAuthScreens.some((s) => segmentsArr.includes(s)) ||
      (segmentsArr[0] === "screens" && preAuthScreens.includes(segmentsArr[1]));
    const onIndexScreen =
      segmentsArr.length === 0 || segmentsArr[0] === "index";

    if (!authState.isAuthenticated && !onPreAuthScreen) {
      router.replace("/screens/Auth");
    } else if (
      authState.isAuthenticated &&
      (segmentsArr.includes("Auth") || onIndexScreen)
    ) {
      router.replace("/screens/WorkoutInput");
    }
  }, [authState.isAuthenticated, loading, segments]);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.backgroundTertiary,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: fontFamily.semibold,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="screens/Auth" options={{ headerShown: false }} />
      <Stack.Screen
        name="screens/GarminLoginWebView"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="screens/WorkoutInput"
        options={{
          title: "Create",
          headerRight: () => <SettingsHeaderButton />,
        }}
      />
      <Stack.Screen
        name="screens/WorkoutPreview"
        options={{
          title: "Preview",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="screens/MultiWorkoutPreview"
        options={{
          title: "Workouts",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="screens/Settings"
        options={{
          title: "Settings",
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <PaceSettingsProvider>
        <RootLayoutNav />
      </PaceSettingsProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
});
