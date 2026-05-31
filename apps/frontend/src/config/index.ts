export const AppConfig = {
  name: "linkdo",
};

import { createLogger } from "@/utils/logger";
const logger = createLogger("config");

export const TOKEN_KEY = "linkdo_token" as const;
export const AGENT_URL =
  (process.env.NEXT_PUBLIC_AGENT_URL as string | undefined) ??
  "http://localhost:6001";
export const AGENT_API_KEY =
  (process.env.NEXT_PUBLIC_AGENT_API_KEY as string | undefined) ?? "";
logger.info("AGENT_API_KEY configured:", AGENT_API_KEY ? "[SET]" : "[EMPTY]");
