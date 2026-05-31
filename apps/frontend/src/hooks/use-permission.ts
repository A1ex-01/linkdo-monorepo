import { usePermissionStore } from "@/stores/permission";

export function usePermission(code: string): boolean {
  const can = usePermissionStore((state) => state.can);
  return can(code);
}

export function useAllPermissions() {
  const permissions = usePermissionStore((state) => state.permissions);
  const isLoaded = usePermissionStore((state) => state.isLoaded);
  return { permissions, isLoaded };
}
