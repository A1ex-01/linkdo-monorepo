"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { uploadImage } from "@/services/file";

const EMOJI_OPTIONS = ["📋", "💼", "🏠", "📚", "🎯", "✨", "🔧", "📝"];

interface ICreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; icon: string; cover?: string }) => void;
}

interface FormValues {
  name: string;
  icon: string;
  cover?: string;
}

export default function CreateCollectionModal({
  isOpen,
  onClose,
  onSubmit,
}: ICreateModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      icon: "📋",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ name: "", icon: "📋" });
    }
  }, [isOpen, reset]);

  const icon = watch("icon");

  const onFormSubmit = (data: FormValues) => {
    if (!data.name.trim()) return;
    onSubmit({ name: data.name.trim(), icon: data.icon, cover: data.cover });
    reset({ name: "", icon: "📋" });
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md rounded-2xl bg-[#1c1b1c] p-6 text-white">
        <DialogHeader className="mb-6 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-bold text-white">
            新建列表
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-[#cfc2d6]">
              List Name
            </label>
            <input
              type="text"
              {...register("name", { required: true })}
              placeholder="e.g., Daily Routine, Work Tasks..."
              className="w-full rounded-lg border border-[rgba(77,67,84,0.3)] bg-[#262626] px-4 py-3 text-sm text-white outline-none placeholder:text-[#6b7280]"
              autoFocus
            />
            {errors.name && (
              <span className="mt-1 block text-xs text-red-400">
                This field is required
              </span>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#cfc2d6]">
              Cover image
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="block w-full text-sm text-[#cfc2d6] file:mr-3 file:rounded-md file:border-0 file:bg-[#363636] file:px-3 file:py-2 file:text-white"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const result = await uploadImage(file, "collection-covers");
                if (result.success && result.data?.path)
                  setValue("cover", result.data.path);
              }}
            />
            {watch("cover") ? (
              <p className="mt-1 text-xs text-emerald-400">Cover uploaded</p>
            ) : null}
          </div>

          <button
            type="submit"
            className="mt-2 w-full cursor-pointer rounded-full border border-solid border-[#3a3a3a] bg-[#2b2b2b] py-3 text-sm font-bold text-black text-white transition-opacity hover:opacity-90"
          >
            Create List
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
