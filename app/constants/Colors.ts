export const Colors = {
  light: {
    primary: "#1A56DB",
    background: "#fff",
    tint: "#F3F4F6",
    secondary: "#6B7280",
    accent: "#10B981",
    titles: "#111827",
    subtitles: "#374151",
    muted: "#6B7280",
    isError: "#DC2626",
  },
  dark: {
    primary: "#1A56DB",
    background: "#fff",
    tint: "#F3F4F6",
    secondary: "#6B7280",
    accent: "#10B981",
    titles: "#111827",
    subtitles: "#374151",
    muted: "#6B7280",
    error: "#DC2626",
  },
} as const;

export type ColorTheme = typeof Colors.light;
