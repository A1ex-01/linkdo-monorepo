import * as SecureStore from "expo-secure-store";
import * as React from "react";
import { Appearance, View } from "react-native";
import { useColorScheme, vars } from "nativewind";

export type AppearanceMode = "light" | "dark" | "system";
export type StyleTheme = "default" | "twitter" | "vercel";

type AppearanceValue = {
  mode: AppearanceMode;
  resolvedColorScheme: "light" | "dark";
  styleTheme: StyleTheme;
  setMode: (mode: AppearanceMode) => void;
  setStyleTheme: (theme: StyleTheme) => void;
};

const MODE_KEY = "linkdo.appearance-mode";
const STYLE_KEY = "linkdo.style-theme";
const AppearanceContext = React.createContext<AppearanceValue | null>(null);

const themeVariables: Record<
  Exclude<StyleTheme, "default">,
  Record<"light" | "dark", Record<string, string>>
> = {
  twitter: {
    light: {
      "--background": "0 0% 100%",
      "--foreground": "211 28% 13%",
      "--card": "197 14% 98%",
      "--card-foreground": "211 28% 13%",
      "--primary": "203 89% 53%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "211 28% 13%",
      "--secondary-foreground": "0 0% 100%",
      "--muted": "240 15% 96%",
      "--muted-foreground": "211 28% 30%",
      "--accent": "210 70% 95%",
      "--accent-foreground": "203 89% 43%",
      "--border": "207 43% 93%",
      "--input": "210 25% 98%",
      "--ring": "203 89% 53%",
      "--radius": "1.3rem",
    },
    dark: {
      "--background": "0 0% 0%",
      "--foreground": "210 20% 93%",
      "--card": "225 12% 21%",
      "--card-foreground": "0 0% 89%",
      "--primary": "203 89% 53%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "210 20% 96%",
      "--secondary-foreground": "211 28% 13%",
      "--muted": "0 0% 21%",
      "--muted-foreground": "215 10% 56%",
      "--accent": "213 44% 19%",
      "--accent-foreground": "203 89% 53%",
      "--border": "215 10% 27%",
      "--input": "213 29% 30%",
      "--ring": "203 89% 53%",
      "--radius": "1.3rem",
    },
  },
  vercel: {
    light: {
      "--background": "0 0% 99%",
      "--foreground": "0 0% 0%",
      "--card": "0 0% 100%",
      "--card-foreground": "0 0% 0%",
      "--primary": "0 0% 0%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "0 0% 94%",
      "--secondary-foreground": "0 0% 0%",
      "--muted": "0 0% 97%",
      "--muted-foreground": "0 0% 44%",
      "--accent": "0 0% 94%",
      "--accent-foreground": "0 0% 0%",
      "--border": "0 0% 92%",
      "--input": "0 0% 94%",
      "--ring": "0 0% 0%",
      "--radius": "0.5rem",
    },
    dark: {
      "--background": "0 0% 0%",
      "--foreground": "0 0% 100%",
      "--card": "0 0% 14%",
      "--card-foreground": "0 0% 100%",
      "--primary": "0 0% 100%",
      "--primary-foreground": "0 0% 0%",
      "--secondary": "0 0% 25%",
      "--secondary-foreground": "0 0% 100%",
      "--muted": "0 0% 23%",
      "--muted-foreground": "0 0% 72%",
      "--accent": "0 0% 32%",
      "--accent-foreground": "0 0% 100%",
      "--border": "0 0% 26%",
      "--input": "0 0% 32%",
      "--ring": "0 0% 72%",
      "--radius": "0.5rem",
    },
  },
};

export function AppearanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [mode, setModeState] = React.useState<AppearanceMode>("system");
  const [styleTheme, setStyleThemeState] =
    React.useState<StyleTheme>("default");
  const nativeColorScheme =
    colorScheme === "dark" || colorScheme === "light" ? colorScheme : undefined;
  const systemColorScheme =
    Appearance.getColorScheme() === "dark" ? "dark" : "light";
  const resolvedColorScheme =
    mode === "system" ? (nativeColorScheme ?? systemColorScheme) : mode;

  React.useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync(MODE_KEY),
      SecureStore.getItemAsync(STYLE_KEY),
    ]).then(([storedMode, storedStyle]) => {
      const nextMode: AppearanceMode =
        storedMode === "light" ||
        storedMode === "dark" ||
        storedMode === "system"
          ? storedMode
          : "system";
      setModeState(nextMode);
      setColorScheme(nextMode);
      if (
        storedStyle === "twitter" ||
        storedStyle === "vercel" ||
        storedStyle === "default"
      )
        setStyleThemeState(storedStyle);
    });
  }, [setColorScheme]);

  const setMode = React.useCallback(
    (nextMode: AppearanceMode) => {
      setModeState(nextMode);
      setColorScheme(nextMode);
      void SecureStore.setItemAsync(MODE_KEY, nextMode);
    },
    [setColorScheme],
  );
  const setStyleTheme = React.useCallback((nextTheme: StyleTheme) => {
    setStyleThemeState(nextTheme);
    void SecureStore.setItemAsync(STYLE_KEY, nextTheme);
  }, []);
  const value = React.useMemo(
    () => ({ mode, resolvedColorScheme, styleTheme, setMode, setStyleTheme }),
    [mode, resolvedColorScheme, setMode, setStyleTheme, styleTheme],
  );
  const style =
    styleTheme === "default"
      ? undefined
      : vars(themeVariables[styleTheme][resolvedColorScheme]);
  return (
    <AppearanceContext.Provider value={value}>
      <View className="flex-1" style={style}>
        {children}
      </View>
    </AppearanceContext.Provider>
  );
}

export function useAppAppearance() {
  const value = React.useContext(AppearanceContext);
  if (!value)
    throw new Error("useAppAppearance must be used within AppearanceProvider");
  return value;
}
