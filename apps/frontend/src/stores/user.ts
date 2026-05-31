// frontend/src/stores/use-auth-store.ts

import { TOKEN_KEY } from "@/config";
import { ApiResponse, getMe, MeResponse } from "@/services/base";
import { IUser } from "@/types/base";
import { create } from "zustand";
import { usePermissionStore } from "./permission";
import { getMyPermissions } from "@/services/permission";

interface IST {
  isFetchedUser: boolean;
  user: IUser | undefined;
  fetchUser: () => Promise<ApiResponse<MeResponse>>;
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
      const permRes = await getMyPermissions();
      if (permRes.success && permRes.data) {
        usePermissionStore.getState().setPermissions(permRes.data);
      }
    } else {
      localStorage.removeItem(TOKEN_KEY);
      usePermissionStore.getState().clear();
      set({ isFetchedUser: true });
    }
    return response;
  },
}));
