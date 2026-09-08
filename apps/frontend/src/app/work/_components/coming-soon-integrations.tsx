import { AIconFigma, AIconMCP } from "@/components/icons/base";
import React from "react";

export const COMING_SOON_INTEGRATIONS = [
  {
    name: "Figma Comments",
    description: "Turn design feedback into tasks",
    icon: <AIconFigma className="size-7" />,
  },
  {
    name: "MCP Server",
    description: "Bring your tools into Link-Do",
    icon: <AIconMCP className="size-7" />,
  },
] as const;
