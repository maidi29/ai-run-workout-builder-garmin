export const colors = {
  // Primary
  primary: "#1F487E",

  // Backgrounds
  background: "#ffffff",
  backgroundSecondary: "#f9f9f9",
  backgroundTertiary: "#f5f5f5",

  // Text
  text: "#1a1a1a",
  textSecondary: "#666666",
  textMuted: "#999999",
  textInverse: "#ffffff",
  textInfo: "#333333",

  // Borders
  border: "#e0e0e0",
  borderDark: "#d0d0d0",

  // Surfaces
  surface: "#f2f2f2",
  surfaceLight: "#f0f0f0",
  surfaceButton: "#e8e8e8",

  // Status
  success: "#27ae60",
  successLight: "#f0faf4",
  error: "#cc3333",
  errorBorder: "#ff8888",
  errorLight: "#ffeeee",
  errorDark: "#e74c3c",
  errorCardBg: "#fef5f4",
  warning: "#f39c12",

  // Info
  info: "#f0f7ff",
  infoBorder: "#cce5ff",
  infoSecondaryBorder: "#d4e4f7",

  // Edit hints
  editHintBg: "#FFF8E7",
  editHintBorder: "#F0D68B",
  editHintText: "#8B7330",

  // Status badges
  statusActiveBg: "#e6f7ff",
  statusInactiveBg: "#ffe6e6",
  badgeBg: "#fde8eb",

  // Listening/Recording
  listening: "#991b1b",
  listeningBg: "#fef2f2",
  listeningActiveBg: "#fee2e2",
} as const;

/** Color lookup for workout step type bar indicators */
export const stepBarColors: Record<string, string> = {
  warmup: "#e74c3c",
  interval: "#3498db",
  cooldown: "#27ae60",
  rest: "rgb(108, 108, 108)",
  recovery: "#f39c12",
  run: "#3498db",
};
