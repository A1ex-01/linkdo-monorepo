"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateProfile } from "@/services/base";
import { resolveFilePath, uploadImage } from "@/services/file";
import { useUserStore } from "@/stores/user";

export function AccountSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const { user, fetchUser } = useUserStore();
  const [name, setName] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) {
      setName(user?.name ?? "");
      setAvatarPath(user?.avatar_url);
    }
  }, [open, user]);
  const save = async () => {
    setSaving(true);
    try {
      const result = await updateProfile({ name, avatar_path: avatarPath });
      if (!result.success) throw new Error(result.error);
      await fetchUser();
      toast.success("Account settings saved");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save settings",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-[#363636] bg-[#151515] p-7 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl">Account settings</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={resolveFilePath(avatarPath)} />
              <AvatarFallback>
                {name.slice(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <label className="cursor-pointer rounded-lg bg-[#2a2a2a] px-4 py-2 text-sm font-medium hover:bg-[#363636]">
              Upload avatar
              <input
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const result = await uploadImage(file, "avatars");
                  if (result.success && result.data?.path) {
                    setAvatarPath(result.data.path);
                    toast.success("Avatar uploaded");
                  }
                }}
              />
            </label>
          </div>
          <label className="block text-sm text-[#b0b0b0]">
            Nickname
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              className="mt-2 w-full rounded-lg border border-[#3b3b3b] bg-[#252525] px-3 py-2 text-white outline-none focus:border-white/60"
            />
          </label>
          <div>
            <p className="text-sm text-[#b0b0b0]">Email</p>
            <p className="mt-2 rounded-lg bg-[#202020] px-3 py-2 text-sm text-[#d0d0d0]">
              {user?.email || "Not set"}
            </p>
          </div>
          <button
            type="button"
            disabled={saving || !name.trim()}
            onClick={save}
            className="w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-black disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
