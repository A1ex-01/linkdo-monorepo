"use client";

import type { TaskLinkTargetOption } from "@/lib/link-targets";
import {
  getRemoteImportCandidates,
  importRemoteTasks,
  type RemoteTaskCandidate,
} from "@/services/task";
import { Button } from "@linkdo/ui/components/button";
import { Checkbox } from "@linkdo/ui/components/checkbox";
import { Input } from "@linkdo/ui/components/input";
import { ScrollArea } from "@linkdo/ui/components/scroll-area";
import { ExternalLinkIcon, LoaderCircleIcon, SearchIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface RemoteTaskImportProps {
  collectionUuid: string;
  target: Pick<TaskLinkTargetOption, "platform" | "uuid" | "label">;
  onImported: () => void;
  statusMappingComplete?: boolean;
  onConfigureStatusMapping?: () => void;
}

export function RemoteTaskImport({
  collectionUuid,
  target,
  onImported,
  statusMappingComplete = true,
  onConfigureStatusMapping,
}: RemoteTaskImportProps) {
  const [items, setItems] = useState<RemoteTaskCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    if (!statusMappingComplete) {
      setItems([]);
      setSelected(new Set());
      setSearch("");
      setIsLoading(false);
      return () => {
        active = false;
      };
    }
    setIsLoading(true);
    setSelected(new Set());
    setSearch("");
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
  }, [statusMappingComplete, target.platform, target.uuid]);

  const selectedItems = useMemo(
    () => items.filter((item) => selected.has(item.remote_id)),
    [items, selected],
  );

  const cardsByStatus = useMemo(() => {
    const groups = new Map<string, RemoteTaskCandidate[]>();
    const query = search.trim().toLocaleLowerCase();

    for (const item of items) {
      if (query && !item.title.toLocaleLowerCase().includes(query)) continue;
      const group = groups.get(item.remote_status) ?? [];
      group.push(item);
      groups.set(item.remote_status, group);
    }

    return [...groups.entries()];
  }, [items, search]);

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
    onImported();
    toast.success(
      `${selectedItems.length} task${selectedItems.length === 1 ? "" : "s"} added`,
    );
  };

  if (!statusMappingComplete) {
    return (
      <section
        aria-label={`Cards from ${target.label}`}
        className="flex flex-col items-start gap-3 py-2"
      >
        <p className="text-muted-foreground text-sm">
          Set every status mapping before importing cards.
        </p>
        <Button onClick={onConfigureStatusMapping} type="button" variant="secondary">
          Configure status mapping
        </Button>
      </section>
    );
  }

  return (
    <section aria-label={`Cards from ${target.label}`} className="space-y-3">
      <div className="relative">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          aria-label="Search cards"
          className="pl-9"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search cards"
          value={search}
        />
      </div>
      <ScrollArea className="h-64">
        {isLoading ? (
          <div className="text-muted-foreground flex h-full items-center justify-center gap-2">
            <LoaderCircleIcon className="size-4 animate-spin" /> Loading cards…
          </div>
        ) : cardsByStatus.length ? (
          <div className="flex flex-col gap-4">
            {cardsByStatus.map(([status, cards]) => (
              <div className="space-y-2" key={status}>
                <h3 className="text-muted-foreground px-1 text-xs font-semibold">
                  {status}
                </h3>
                {cards.map((item) => (
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
                        <ExternalLinkIcon className="text-muted-foreground hover:text-foreground size-4" />
                      </a>
                    )}
                  </label>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-12 text-center text-sm">
            No matching unfinished cards.
          </p>
        )}
      </ScrollArea>
      <Button
        className="w-full"
        disabled={!selectedItems.length || isImporting}
        onClick={handleImport}
      >
        {isImporting && (
          <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
        )}
        Add Selected Cards ({selectedItems.length})
      </Button>
    </section>
  );
}
