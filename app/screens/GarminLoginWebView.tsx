/**
 * Garmin SSO WebView
 * Loads Garmin's sign-in page in an in-app browser. The user logs in
 * (handles their own MFA if any). On success Garmin redirects to
 * `https://sso.garmin.com/sso/embed?ticket=ST-...`. We intercept that
 * navigation, extract the ticket, post it to the backend for OAuth2
 * exchange, and store the resulting tokens.
 */

import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import WebView, {
  WebViewNavigation,
  WebViewMessageEvent,
} from "react-native-webview";
import { AppText as Text } from "../../components/AppText";
import { apiClient } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { colors, fontSize, fontFamily } from "../../theme";

const SSO = "https://sso.garmin.com/sso";
const SSO_EMBED = `${SSO}/embed`;

const SIGNIN_PARAMS = new URLSearchParams({
  id: "gauth-widget",
  embedWidget: "true",
  gauthHost: SSO,
  service: SSO_EMBED,
  source: SSO_EMBED,
  redirectAfterAccountLoginUrl: SSO_EMBED,
  redirectAfterAccountCreationUrl: SSO_EMBED,
});

const SIGNIN_URL = `${SSO}/signin?${SIGNIN_PARAMS.toString()}`;

const TICKET_RE = /[?&]ticket=(ST-[A-Za-z0-9._-]+)/;

export default function GarminLoginWebView() {
  const router = useRouter();
  const { loginWithTokens } = useAuth();
  const [exchanging, setExchanging] = useState(false);
  const ticketHandled = useRef(false);

  const handleTicket = async (ticket: string) => {
    if (ticketHandled.current) return;
    ticketHandled.current = true;
    setExchanging(true);
    try {
      const response = await apiClient.garmin.exchangeTicket(ticket);
      if (!response.success) throw new Error("Sign-in failed");
      await loginWithTokens(
        response.access_token,
        response.refresh_token,
        response.expires_in,
        response.userId,
        response.displayName,
      );
      router.replace("/screens/WorkoutInput");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Sign-in failed. Please try again.";
      Alert.alert("Sign-in Error", message);
      ticketHandled.current = false;
      setExchanging(false);
    }
  };

  const onNavigationStateChange = (nav: WebViewNavigation) => {
    const match = nav.url.match(TICKET_RE);
    if (match) {
      void handleTicket(match[1]);
    }
  };

  // Defensive fallback: if the redirect happens too fast for navigation
  // events to fire, the page may end up showing the post-ticket embed page.
  // Inject a small script that watches `location.href` and posts back any
  // ticket it finds.
  const onMessage = (e: WebViewMessageEvent) => {
    const match = e.nativeEvent.data?.match(TICKET_RE);
    if (match) void handleTicket(match[1]);
  };

  const injectedJavaScript = `
    (function() {
      var sent = false;
      function injectStyles() {
        try {
          var css =
            "#login-component { padding: 1rem; }\\n" +
            "#login-btn-signin { background: #1F487E; border: #1F487E; margin-top: 0.5rem; width: 100%; border-radius: 99px;}\\n" +
            "#login-component .textfield input { width: 100%;}";

          var styleEl = document.getElementById("app-login-styles");
          if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = "app-login-styles";
            styleEl.type = "text/css";
            document.head && document.head.appendChild(styleEl);
          }
          if (styleEl) styleEl.textContent = css;
        } catch (e) {
          // Best-effort only: Garmin pages may use CSP / iframes.
        }
      }

      injectStyles();
      function check() {
        if (sent) return;
        var m = location.href.match(/[?&]ticket=(ST-[A-Za-z0-9._\\-]+)/);
        if (m) {
          sent = true;
          window.ReactNativeWebView.postMessage(location.href);
        }
      }
      check();
      setInterval(function() {
        injectStyles();
        check();
      }, 200);
    })();
    true;
  `;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
          accessibilityLabel="Cancel"
          disabled={exchanging}
        >
          <Feather name="x" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign in to Garmin</Text>
        <View style={styles.closeButton} />
      </View>
      <WebView
        source={{ uri: SIGNIN_URL }}
        onNavigationStateChange={onNavigationStateChange}
        onMessage={onMessage}
        injectedJavaScript={injectedJavaScript}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        incognito
      />
      {exchanging && (
        <View style={styles.exchangingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.exchangingText}>Finishing sign-in…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderDark,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semibold,
    color: colors.text,
  },
  closeButton: {
    padding: 8,
    width: 40,
    alignItems: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  exchangingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    gap: 12,
  },
  exchangingText: {
    color: colors.textInverse,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
  },
});
