// frontend/src/stores/use-auth-store.ts

import { TOKEN_KEY } from "@/config";
import { ApiResponse, getMe, MeResponse } from "@/services/base";
import { IUser } from "@/types/base";
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
      localStorage.removeItem(TOKEN_KEY);
      set({ isFetchedUser: true });
    }
    return response;
  },
  clearUser: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: undefined, isFetchedUser: false });
  },
}));
