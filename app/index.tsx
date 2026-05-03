/**
 * Root route - redirects to Auth or Create based on auth state
 */

import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { colors } from "../theme";

export default function Index() {
  const { state, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (state.isAuthenticated) {
    return <Redirect href="/screens/WorkoutInput" />;
  }
  return <Redirect href="/screens/Auth" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
});
