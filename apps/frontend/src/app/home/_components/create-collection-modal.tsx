"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resolveFilePath, uploadImage } from "@/services/file";
import type { ICollection } from "@/types/base";
import {
  IconCheck,
  IconList,
  IconPhoto,
  IconUpload,
} from "@tabler/icons-react";
import { type ChangeEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

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
      <DialogContent className="w-[520px]! max-w-[900px]! overflow-hidden p-0 shadow-2xl">
        <div className="p-6">
          <DialogHeader className="mb-6 pr-8 text-left">
            <p className="text-muted-foreground mb-1 text-[11px] font-bold tracking-[0.14em] uppercase">
              Your workspace
            </p>
            <DialogTitle className="text-foreground text-[22px] font-bold tracking-[-0.03em]">
              {collection ? "Edit list" : "Create new list"}
            </DialogTitle>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              {collection
                ? "Refresh its identity without losing the work inside."
                : "A focused space for the tasks you want to move forward."}
            </p>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onFormSubmit)}
            className="flex flex-col gap-5"
          >
            <div className="bg-muted relative overflow-hidden rounded-2xl border p-4">
              {cover ? (
                <img
                  src={resolveFilePath(cover)}
                  alt=""
                  className="absolute inset-0 size-full object-cover opacity-25"
                />
              ) : null}
              <div className="relative flex items-center gap-3">
                <div className="bg-accent text-accent-foreground flex size-11 items-center justify-center rounded-xl border">
                  <IconList className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-foreground truncate text-base font-semibold">
                    {name?.trim() || "Untitled list"}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    List preview
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="collection-name"
                className="text-foreground mb-2 block text-[13px] font-semibold"
              >
                List name
              </label>
              <input
                id="collection-name"
                type="text"
                {...register("name", { required: true })}
                placeholder="e.g. Daily routine"
                className="bg-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring h-11 w-full rounded-xl border px-3.5 text-sm transition-colors outline-none focus-visible:ring-2"
                autoFocus
              />
              {errors.name ? (
                <span className="text-destructive mt-1.5 block text-xs">
                  Give your list a name to continue.
                </span>
              ) : null}
            </div>

            <div>
              <p className="text-foreground mb-2 text-[13px] font-semibold">
                Cover image{" "}
                <span className="text-muted-foreground font-normal">
                  Optional
                </span>
              </p>
              <label className="hover:bg-accent bg-muted hover:border-accent-foreground flex h-14 cursor-pointer items-center gap-3 rounded-xl border border-dashed px-3.5 transition-colors">
                <span className="bg-accent/50 text-muted-foreground flex size-8 items-center justify-center rounded-lg">
                  {cover ? (
                    <IconCheck className="text-foreground size-4" />
                  ) : (
                    <IconPhoto className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="text-foreground block truncate font-medium">
                    {cover ? "Cover image ready" : "Upload a cover image"}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    PNG, JPG, WebP, or GIF
                  </span>
                </span>
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
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

            <Button
              type="submit"
              className="mt-1 h-11 w-full text-sm font-bold"
            >
              {collection ? "Save changes" : "Create list"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
