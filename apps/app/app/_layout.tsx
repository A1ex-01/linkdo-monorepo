import "@/global.css";

import { AppearanceProvider, useAppAppearance } from "@/lib/appearance";
import { AuthProvider, useLinkdoAuth } from "@/lib/auth";
import { getNavigationTheme } from "@/lib/theme";
import { ThemeProvider } from "expo-router/react-navigation";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as React from "react";

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppearanceProvider>
        <AppNavigation />
      </AppearanceProvider>
    </AuthProvider>
  );
}

function AppNavigation() {
  const { resolvedColorScheme, styleTheme } = useAppAppearance();

  return (
    <ThemeProvider value={getNavigationTheme(resolvedColorScheme, styleTheme)}>
      <StatusBar style={resolvedColorScheme === "dark" ? "light" : "dark"} />
      <Routes />
    </ThemeProvider>
  );
}

function Routes() {
  const { token, isLoading } = useLinkdoAuth();

  React.useEffect(() => {
    if (!isLoading) void SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;
  return (
    <Stack>
      <Stack.Protected guard={!token}>
        <Stack.Screen name="(auth)/sign-in" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(token)}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
