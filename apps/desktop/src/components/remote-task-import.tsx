"use client";

import type { TaskLinkTargetOption } from "@/lib/link-targets";
import {
  getRemoteImportCandidates,
  importRemoteTasks,
  type RemoteTaskCandidate,
} from "@/services/task";
import type { TaskStatus } from "@/types/base";
import { Button } from "@linkdo/ui/components/button";
import { Checkbox } from "@linkdo/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@linkdo/ui/components/dialog";
import { ScrollArea } from "@linkdo/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@linkdo/ui/components/select";
import { ExternalLinkIcon, ImportIcon, LoaderCircleIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface RemoteTaskImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionUuid: string;
  target: Pick<TaskLinkTargetOption, "platform" | "uuid" | "label">;
  onImported: () => void;
}

interface RemoteTaskImportButtonProps {
  targetLabel: string;
  onOpen: () => void;
}

export function RemoteTaskImportButton({
  targetLabel,
  onOpen,
}: RemoteTaskImportButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`Import tasks from ${targetLabel}`}
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
    >
      <ImportIcon />
    </Button>
  );
}

export function RemoteTaskImport({
  open,
  onOpenChange,
  collectionUuid,
  target,
  onImported,
}: RemoteTaskImportProps) {
  const [items, setItems] = useState<RemoteTaskCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [targetStatus, setTargetStatus] = useState<TaskStatus>("backlog");

  useEffect(() => {
    if (!open) return;
    let active = true;
    setIsLoading(true);
    setSelected(new Set());
    getRemoteImportCandidates(target.platform, target.uuid)
      .then((response) => {
        if (!active) return;
        if (!response.success) {
          toast.error(response.message ?? "Failed to load remote tasks");
          setItems([]);
          return;
        }
        setItems(response.data ?? []);
      })
      .catch(() => {
        if (active) toast.error("Failed to load remote tasks");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, target.platform, target.uuid]);

  const selectedItems = useMemo(
    () => items.filter((item) => selected.has(item.remote_id)),
    [items, selected],
  );

  const toggleItem = (remoteId: string, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(remoteId);
      else next.delete(remoteId);
      return next;
    });
  };

  const handleImport = async () => {
    if (!selectedItems.length) return;
    setIsImporting(true);
    const response = await importRemoteTasks(collectionUuid, {
      source: target.platform,
      ...(target.platform === "notion"
        ? { notion_database_uuid: target.uuid }
        : { clickup_list_uuid: target.uuid }),
      status: targetStatus,
      prev_rank: "",
      next_rank: "",
      items: selectedItems.map(({ remote_id, title }) => ({
        remote_id,
        title,
      })),
    });
    setIsImporting(false);
    if (!response.success) {
      toast.error(response.message ?? "Failed to import tasks");
      return;
    }
    onOpenChange(false);
    onImported();
    toast.success(
      `${selectedItems.length} task${selectedItems.length === 1 ? "" : "s"} added`,
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-lg gap-0 p-0"
          showCloseButton={!isImporting}
        >
          <DialogHeader className="border-b px-5 py-4 pr-12">
            <DialogTitle>Import unfinished tasks</DialogTitle>
            <DialogDescription>
              {target.platform === "notion" ? "Notion" : "ClickUp"} /{" "}
              {target.label}
            </DialogDescription>
          </DialogHeader>
          <div className="border-b px-5 py-3">
            <Select
              value={targetStatus}
              onValueChange={(value) => setTargetStatus(value as TaskStatus)}
            >
              <SelectTrigger aria-label="Target position" className="w-full">
                <SelectValue placeholder="Target position" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="h-80 px-5 py-4">
            {isLoading ? (
              <div className="text-muted-foreground flex h-full items-center justify-center">
                <LoaderCircleIcon className="animate-spin" /> Loading tasks…
              </div>
            ) : items.length ? (
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <label
                    key={item.remote_id}
                    className="bg-muted/50 hover:bg-muted flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3"
                  >
                    <Checkbox
                      aria-label={item.title}
                      checked={selected.has(item.remote_id)}
                      onCheckedChange={(checked) =>
                        toggleItem(item.remote_id, checked === true)
                      }
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {item.title}
                    </span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${item.title} in ${target.platform === "notion" ? "Notion" : "ClickUp"}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <ExternalLinkIcon />
                      </a>
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-16 text-center">
                No unfinished tasks to import.
              </p>
            )}
          </ScrollArea>
          <DialogFooter className="m-0 sm:justify-stretch">
            <Button
              className="w-full"
              disabled={!selectedItems.length || isImporting}
              onClick={handleImport}
            >
              {isImporting && (
                <LoaderCircleIcon
                  className="animate-spin"
                  data-icon="inline-start"
                />
              )}
              Add Selected Cards ({selectedItems.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
