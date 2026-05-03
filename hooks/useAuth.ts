/**
 * Authentication Hook + Context
 * Manages OAuth2 tokens stored on-device via expo-secure-store.
 * Backend is stateless -- only used for the SSO login flow.
 *
 * Uses React Context so all consumers share the same auth state.
 *
 * Key reliability features:
 *  - AppState listener refreshes tokens when the app returns to foreground
 *  - API client 401 interceptor automatically refreshes and retries
 *  - De-duplicated concurrent refresh calls (handled in garminAuthService)
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import * as SecureStore from "expo-secure-store";
import { garminAuthService } from "../services/garminAuthService";
import { apiClient } from "../api/client";
import { AuthState } from "../types";

interface AuthContextValue {
  state: AuthState;
  loading: boolean;
  error?: string;
  loginWithTokens: (
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    userId: string,
    displayName?: string,
  ) => Promise<void>;
  refreshToken: () => Promise<void>;
  logout: () => Promise<void>;
  isTokenExpired: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // ── Refresh helper (shared by init, foreground listener, manual call) ─
  const doRefresh = useCallback(async (): Promise<string> => {
    const result = await garminAuthService.ensureValidToken();
    if (!result) {
      throw new Error("Token refresh failed — no valid token");
    }
    // Update React state with whatever ensureValidToken resolved to
    setState((prev) => ({
      ...prev,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }));
    return result.accessToken;
  }, []);

  // ── Register the 401-retry callback on the API client ──────────────
  useEffect(() => {
    apiClient.setTokenRefreshCallback(async () => {
      const result = await garminAuthService.ensureValidToken();
      if (!result) {
        // Refresh impossible — force logout
        await garminAuthService.clearStorage();
        setState({ isAuthenticated: false });
        throw new Error("Session expired — please log in again");
      }
      setState((prev) => ({
        ...prev,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      }));
      return result.accessToken;
    });

    return () => {
      apiClient.setTokenRefreshCallback(null);
    };
  }, []);

  // ── Initialize auth state from stored tokens ───────────────────────
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // ensureValidToken reads storage, refreshes if expired, and saves
        const result = await garminAuthService.ensureValidToken();

        if (result) {
          const displayName =
            (await SecureStore.getItemAsync("display_name")) || undefined;
          const expiresAtStr =
            await SecureStore.getItemAsync("token_expires_at");

          setState({
            isAuthenticated: true,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            userId: result.userId,
            displayName,
            expiresAt: expiresAtStr ? parseInt(expiresAtStr, 10) : undefined,
          });

          // Start the background refresh timer
          await garminAuthService.initializeRefreshTimer();
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
        setError("Failed to load authentication state");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ── AppState listener: refresh tokens when returning to foreground ─
  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        // App came to foreground — make sure token is still valid
        try {
          const result = await garminAuthService.ensureValidToken();
          if (result) {
            setState((prev) => ({
              ...prev,
              accessToken: result.accessToken,
              refreshToken: result.refreshToken,
            }));
            // Re-arm the background refresh timer
            await garminAuthService.initializeRefreshTimer();
          } else if (state.isAuthenticated) {
            // Refresh failed — force user to sign in again via WebView.
            await garminAuthService.clearStorage();
            setState({ isAuthenticated: false });
            setError("Session expired — please log in again");
          }
        } catch {
          // Network error returning to foreground — stay optimistic
        }
      }
      appStateRef.current = nextState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [state.isAuthenticated]);

  // ── Public API ─────────────────────────────────────────────────────

  /**
   * Store OAuth2 tokens returned from backend SSO login
   */
  const loginWithTokens = useCallback(
    async (
      accessToken: string,
      refreshToken: string,
      expiresIn: number,
      userId: string,
      displayName?: string,
    ) => {
      try {
        setError(undefined);
        await garminAuthService.saveLoginResult(
          accessToken,
          refreshToken,
          expiresIn,
          userId,
          displayName,
        );
        setState({
          isAuthenticated: true,
          accessToken,
          refreshToken,
          userId,
          displayName,
          expiresAt: Date.now() + expiresIn * 1000,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const refreshTokenFn = useCallback(async () => {
    try {
      await doRefresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Token refresh failed";
      setError(message);
      throw err;
    }
  }, [doRefresh]);

  /**
   * Logout: just clear local storage, no backend call needed.
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);
      await garminAuthService.clearStorage();
      setState({ isAuthenticated: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const isTokenExpired = useCallback(async () => {
    return garminAuthService.isTokenExpired();
  }, []);

  const value: AuthContextValue = {
    state,
    loading,
    error,
    loginWithTokens,
    refreshToken: refreshTokenFn,
    logout,
    isTokenExpired,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

/**
 * Hook to access shared auth state. Must be used within AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
