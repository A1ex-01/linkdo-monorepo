import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

const LINKDO_BASE_URL = process.env.LINKDO_API_BASE_URL ?? "http://localhost:8080";

export interface LinkdoTokenData {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt: number;
  linkdoToken: string;
  userId?: string;
}

/** Minimal store interface — we don't support dynamic client registration */
const clientsStore = {
  async getClient(_clientId: string) {
    return undefined;
  },
};

/**
 * LinkDoAuthProvider verifies MCP tokens by calling the backend's /oauth/introspect endpoint.
 * Authorization codes and MCP tokens are issued by the Go backend.
 */
export class LinkDoAuthProvider {
  get clientsStore() {
    return clientsStore;
  }

  async authorize(): Promise<void> {
    throw new Error("authorize() is handled by the backend at /oauth/authorize");
  }

  async challengeForAuthorizationCode(): Promise<string> {
    throw new Error("challengeForAuthorizationCode is handled by the backend");
  }

  async exchangeAuthorizationCode(): Promise<{ access_token: string; token_type: string; expires_in: number; scope: string }> {
    throw new Error("exchangeAuthorizationCode is handled by the backend at /oauth/token");
  }

  async exchangeRefreshToken(): Promise<{ access_token: string; token_type: string; expires_in: number; scope: string }> {
    throw new Error("Refresh token exchange is not implemented");
  }

  /**
   * Verify an MCP access token by calling the backend's /oauth/introspect endpoint.
   */
  async verifyAccessToken(token: string): Promise<AuthInfo> {
    try {
      const res = await fetch(`${LINKDO_BASE_URL}/oauth/introspect`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as {
        active: boolean;
        scope?: string;
        client_id?: string;
        exp?: number;
        user_id?: string;
        linkdo_token?: string;
      };

      if (!data.active) {
        throw new Error("Token is not active");
      }

      return {
        token,
        clientId: data.client_id ?? "unknown",
        scopes: data.scope ? data.scope.split(" ") : [],
        expiresAt: data.exp,
        extra: {
          linkdoToken: data.linkdo_token ?? "",
          userId: data.user_id ?? "",
        },
      };
    } catch (err) {
      throw new Error(`Token verification failed: ${String(err)}`);
    }
  }
}

export const authProvider = new LinkDoAuthProvider();
