// frontend/src/stores/use-auth-store.ts

import { TOKEN_KEY } from "@/config";
import { clearToken } from "@/services/auth-session";
import { type ApiResponse, getMe, type MeResponse } from "@/services/base";
import type { IUser } from "@/types/base";
import { create } from "zustand";

interface IST {
  isFetchedUser: boolean;
  user: IUser | undefined;
  fetchUser: () => Promise<ApiResponse<MeResponse>>;
  clearUser: () => void;
}

export const useUserStore = create<IST>((set) => ({
  isFetchedUser: false,
  user: undefined,
  fetchUser: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ isFetchedUser: true });
      return { success: false, message: "未登录" } as ApiResponse<MeResponse>;
    }
    const response = await getMe();
    if (response.success) {
      set({ user: response.data, isFetchedUser: true });
    } else {
      clearToken();
      set({ isFetchedUser: true });
    }
    return response;
  },
  clearUser: () => {
    clearToken();
    set({ user: undefined, isFetchedUser: false });
  },
}));
