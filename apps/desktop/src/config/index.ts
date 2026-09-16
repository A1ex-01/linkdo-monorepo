export const AppConfig = {
  name: "linkdo",
};

export const TOKEN_KEY = "linkdo_token" as const;
export const AGENT_URL =
  (process.env.NEXT_PUBLIC_AGENT_URL as string | undefined) ??
  "http://localhost:6001";
export const AGENT_API_KEY =
  (process.env.NEXT_PUBLIC_AGENT_API_KEY as string | undefined) ?? "";
console.log("🐽🐽 ~ index.ts ~ AGENT_API_KEY:", AGENT_API_KEY);
