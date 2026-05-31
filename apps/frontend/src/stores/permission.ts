import type { PermissionCode } from "@/types/rbac";
import { create } from "zustand";

interface IPermissionState {
  permissions: PermissionCode[];
  isLoaded: boolean;
  setPermissions: (perms: PermissionCode[]) => void;
  can: (code: string) => boolean;
  clear: () => void;
}

export const usePermissionStore = create<IPermissionState>((set, get) => ({
  permissions: [],
  isLoaded: false,
  setPermissions: (perms) => set({ permissions: perms, isLoaded: true }),
  can: (code: string) => get().permissions.includes(code as PermissionCode),
  clear: () => set({ permissions: [], isLoaded: false }),
}));
