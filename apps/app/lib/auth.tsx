import * as SecureStore from "expo-secure-store";
import * as React from "react";

const TOKEN_KEY = "linkdo.auth-token";
const BASE_URL =
  process.env.EXPO_PUBLIC_LINKDO_API_URL ?? "https://api.a1ex.online";

type AuthContextValue = {
  token: string | null;
  isLoading: boolean;
  requestCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY)
      .then(setToken)
      .finally(() => setIsLoading(false));
  }, []);

  const post = React.useCallback(async (path: string, data: object) => {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = (await response.json()) as {
      success: boolean;
      data?: { token?: string };
      error?: string;
      message?: string;
    };
    if (!response.ok || !payload.success)
      throw new Error(payload.error ?? payload.message ?? "Request failed");
    return payload;
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      token,
      isLoading,
      requestCode: async (email) => {
        await post("/api/auth/email/send-code", { email });
      },
      verifyCode: async (email, code) => {
        const payload = await post("/api/auth/email/verify", { email, code });
        if (!payload.data?.token)
          throw new Error("The sign-in response did not contain a token");
        await SecureStore.setItemAsync(TOKEN_KEY, payload.data.token);
        setToken(payload.data.token);
      },
      signOut: async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setToken(null);
      },
    }),
    [isLoading, post, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useLinkdoAuth() {
  const context = React.useContext(AuthContext);
  if (!context)
    throw new Error("useLinkdoAuth must be used within AuthProvider");
  return context;
}

export const linkdoApiUrl = BASE_URL;
