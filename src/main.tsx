
import { createRoot } from "react-dom/client";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useTheme as useNextTheme } from "next-themes";
import { Provider } from "react-redux";
import { CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import App from "./app/App";
import "./styles/index.css";
import { store } from "./store/store";
import "./i18n";

const lightPaletteTokens = {
  background: "#ffffff",
  foreground: "#333333",
  card: "#ffffff",
  primary: "#030213",
  primaryForeground: "#ffffff",
  secondary: "#f3f4f6",
  secondaryForeground: "#030213",
  mutedForeground: "#717182",
  border: "rgba(0, 0, 0, 0.1)",
  destructive: "#d4183d",
  destructiveForeground: "#ffffff",
};

const darkPaletteTokens = {
  background: "#121212",
  foreground: "#e0e0e0",
  card: "#1a1a1a",
  primary: "#e0e0e0",
  primaryForeground: "#121212",
  secondary: "#2a2a2a",
  secondaryForeground: "#e0e0e0",
  mutedForeground: "#a3a3a3",
  border: "rgba(255, 255, 255, 0.12)",
  destructive: "#d4183d",
  destructiveForeground: "#ffffff",
};

function MuiAppThemeProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useNextTheme();
  const isDark = resolvedTheme === "dark";

  const theme = useMemo(() => {
    const t = isDark ? darkPaletteTokens : lightPaletteTokens;
    return createTheme({
      shape: { borderRadius: 10 },
      typography: { fontFamily: "inherit" },
      palette: {
        mode: isDark ? "dark" : "light",
        primary: { main: t.primary, contrastText: t.primaryForeground },
        secondary: { main: t.secondary, contrastText: t.secondaryForeground },
        error: { main: t.destructive, contrastText: t.destructiveForeground },
        background: { default: t.background, paper: t.card },
        text: { primary: t.foreground, secondary: t.mutedForeground },
        divider: t.border,
      },
      components: {
        MuiButtonBase: {
          defaultProps: { disableRipple: true },
        },
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: t.background,
              color: t.foreground,
            },
          },
        },
      },
    });
  }, [isDark]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="eda-platform-theme"
    >
      <MuiAppThemeProvider>
        <App />
      </MuiAppThemeProvider>
    </NextThemesProvider>
  </Provider>,
);
  
