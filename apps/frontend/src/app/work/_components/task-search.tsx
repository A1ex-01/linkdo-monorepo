"use client";

import { useData } from "@/app/work/data-provider";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchTasksByTitle } from "@/lib/task-search";
import { getTasks } from "@/services/collection";
import type { ITask } from "@/types/base";
import { IconSearch } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function TaskSearch() {
  const router = useRouter();
  const { collections } = useData();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    void Promise.all(collections.map((collection) => getTasks(collection.uuid)))
      .then((responses) => {
        if (!cancelled) {
          setTasks(responses.flatMap((response) => response.data ?? []));
        }
      })
      .catch(() => {
        if (!cancelled) setTasks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [collections, open]);

  const results = useMemo(
    () => searchTasksByTitle(tasks, query),
    [query, tasks],
  );
  const collectionsByUuid = useMemo(
    () =>
      new Map(collections.map((collection) => [collection.uuid, collection])),
    [collections],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setQuery("");
  };

  return (
    <>
      <button
        type="button"
        aria-label="Search tasks"
        data-tauri-drag-region="false"
        onClick={() => setOpen(true)}
        className="text-atext-460 flex size-8 items-center justify-center rounded-md border border-[#303030] bg-[#181818] transition-colors hover:bg-[#242424] hover:text-white focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none"
      >
        <IconSearch className="size-4" />
      </button>

      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search tasks by name..."
        />
        <CommandList className="max-h-96">
          {!query ? (
            <div className="text-atext-460 px-4 py-8 text-center text-sm">
              Search tasks across all lists
            </div>
          ) : loading ? (
            <div className="text-atext-460 px-4 py-8 text-center text-sm">
              Loading tasks...
            </div>
          ) : (
            <>
              <CommandEmpty>No matching tasks found.</CommandEmpty>
              <CommandGroup heading="Tasks">
                {results.map((task) => {
                  const collection = collectionsByUuid.get(
                    task.collection_uuid,
                  );
                  return (
                    <CommandItem
                      key={task.uuid}
                      value={`${task.title} ${collection?.name ?? ""}`}
                      onSelect={() => {
                        setOpen(false);
                        router.push(`/work?uuid=${task.collection_uuid}`);
                      }}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#6f98e8]/15 text-xs font-semibold text-[#8eaeef]">
                        {collection?.name.trim().charAt(0).toUpperCase() ?? "?"}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {task.title}
                      </span>
                      <span className="text-atext-460 max-w-28 truncate text-xs">
                        {collection?.name}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
