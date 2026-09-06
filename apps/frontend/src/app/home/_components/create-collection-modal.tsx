"use client";

import {
  IconCheck,
  IconList,
  IconPhoto,
  IconUpload,
} from "@tabler/icons-react";
import { type ChangeEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resolveFilePath, uploadImage } from "@/services/file";
import type { ICollection } from "@/types/base";

interface ICreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; cover?: string }) => void;
  collection?: ICollection;
}

interface FormValues {
  name: string;
  cover?: string;
}

export default function CreateCollectionModal({
  isOpen,
  onClose,
  onSubmit,
  collection,
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
    },
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      reset({
        name: collection?.name ?? "",
        cover: collection?.cover,
      });
    }
  }, [collection, isOpen, reset]);

  const name = watch("name");
  const cover = watch("cover");

  const handleCoverChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadImage(file, "collection-covers");
      if (result.success && result.data?.path) {
        setValue("cover", result.data.path);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const onFormSubmit = (data: FormValues) => {
    if (!data.name.trim()) return;
    onSubmit({ name: data.name.trim(), cover: data.cover });
    reset({ name: "" });
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-[460px] overflow-hidden rounded-[22px] border border-white/[0.09] bg-[#171717] p-0 text-white shadow-2xl">
        <div className="h-1 w-full bg-[#343438]" />
        <div className="p-6">
          <DialogHeader className="mb-6 pr-8 text-left">
            <p className="text-linkdo-mist mb-1 text-[11px] font-bold tracking-[0.14em] uppercase">
              Your workspace
            </p>
            <DialogTitle className="text-[22px] font-bold tracking-[-0.03em] text-white">
              {collection ? "Edit list" : "Create new list"}
            </DialogTitle>
            <p className="mt-2 text-sm leading-6 text-[#8d8d92]">
              {collection
                ? "Refresh its identity without losing the work inside."
                : "A focused space for the tasks you want to move forward."}
            </p>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onFormSubmit)}
            className="flex flex-col gap-5"
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#202022] p-4">
              {cover ? (
                <img
                  src={resolveFilePath(cover)}
                  alt=""
                  className="absolute inset-0 size-full object-cover opacity-25"
                />
              ) : null}
              <div className="relative flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl border border-white/[0.08] bg-[#2d2d30] text-[#d7d7da]">
                  <IconList className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-[#f4f4f5]">
                    {name?.trim() || "Untitled list"}
                  </p>
                  <p className="mt-0.5 text-xs text-[#98989e]">List preview</p>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="collection-name"
                className="mb-2 block text-[13px] font-semibold text-[#d7d7da]"
              >
                List name
              </label>
              <input
                id="collection-name"
                type="text"
                {...register("name", { required: true })}
                placeholder="e.g. Daily routine"
                className="focus:border-linkdo-blue focus:ring-linkdo-blue/20 h-11 w-full rounded-xl border border-white/[0.08] bg-[#202022] px-3.5 text-sm text-white transition-colors outline-none placeholder:text-[#69696f] focus:ring-2"
                autoFocus
              />
              {errors.name ? (
                <span className="mt-1.5 block text-xs text-red-400">
                  Give your list a name to continue.
                </span>
              ) : null}
            </div>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-[#d7d7da]">
                Cover image{" "}
                <span className="font-normal text-[#77777d]">Optional</span>
              </p>
              <label className="hover:border-linkdo-blue/70 flex h-14 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/[0.12] bg-[#1c1c1e] px-3.5 transition-colors hover:bg-[#202024]">
                <span className="flex size-8 items-center justify-center rounded-lg bg-white/[0.07] text-[#b8b8bf]">
                  {cover ? (
                    <IconCheck className="size-4 text-[#d7d7da]" />
                  ) : (
                    <IconPhoto className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block truncate font-medium text-[#dedee1]">
                    {cover ? "Cover image ready" : "Upload a cover image"}
                  </span>
                  <span className="block text-xs text-[#76767c]">
                    PNG, JPG, WebP, or GIF
                  </span>
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#b4b4ba]">
                  <IconUpload className="size-3.5" />
                  {isUploading ? "Uploading" : "Browse"}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  disabled={isUploading}
                  onChange={handleCoverChange}
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-1 flex h-11 w-full items-center justify-center rounded-xl bg-[#f1f1f2] text-sm font-bold text-[#171717] transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
            >
              {collection ? "Save changes" : "Create list"}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
