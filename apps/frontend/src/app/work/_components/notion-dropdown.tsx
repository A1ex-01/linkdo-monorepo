import { AIconNotion } from "@/components/icons/base";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  createNotionDatabase,
  fetchStatusOptions,
  getStatusMapping,
  removeNotionDatabase,
  searchNotionDatabases,
  updateStatusMapping,
} from "@/services/notion";
import { useCommonStore } from "@/stores/common";
import { useUserStore } from "@/stores/user";
import { INotionDatabase } from "@/types/base";
import {
  IconBrandNotion,
  IconChevronRight,
  IconDatabase,
  IconExternalLink,
  IconInfoCircle,
  IconLink,
  IconLoader2,
  IconRefresh,
} from "@tabler/icons-react";
import { open } from "@tauri-apps/plugin-shell";
import { useRequest } from "ahooks";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useData } from "../data-provider";
import { launchDesktopLinkOAuth } from "./link-oauth";
interface IProps {
  className: string;
}
export function NotionDropdown({ className }: IProps) {
  const { user, fetchUser } = useUserStore();
  const { currCollectionNotionDbs, isFetchingCurrCollectionNotionDbs } =
    useCommonStore();
  const [showDetailItem, setShowDetailItem] = useState<INotionDatabase>();
  const [statusMapping, setStatusMapping] = useState<string[] | undefined>();
  const [currDbStatusMapping, setCurrDbStatusMapping] = useState<
    Record<"mapping", Record<string, string>> | undefined
  >();

  const getCurrItemStatusMapping = async (database_id: string) => {
    const res = await fetchStatusOptions(database_id);
    if (res.success) {
      setStatusMapping(res.data);
    }
  };
  const getCurrDbStatusMapping = async (database_id: string) => {
    const res = await getStatusMapping(database_id);
    if (res.success) {
      setCurrDbStatusMapping(
        res.data as unknown as Record<"mapping", Record<string, string>>,
      );
    }
  };

  useEffect(() => {
    if (showDetailItem?.uuid) {
      getCurrItemStatusMapping(showDetailItem?.uuid);
      getCurrDbStatusMapping(showDetailItem?.uuid);
    }
  }, [showDetailItem?.uuid]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={"outline"}
          size={"icon"}
          className="border-border bg-card hover:bg-accent"
        >
          <AIconNotion alt="Notion" className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[380px] overflow-hidden rounded-xl border border-white/10 bg-[#181818] p-3 shadow-2xl shadow-black/40"
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (e.target instanceof HTMLElement) {
            if (e.target.closest("[data-radix-select-content]")) {
              e.preventDefault();
            }
          }
        }}
      >
        {/* User Info */}
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-[#242424] shadow-sm">
            <AIconNotion alt="" className="size-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[13px] font-semibold text-[#f1f1f1]">
              Notion{" "}
              <span className="ml-1 text-[10px] font-medium text-[#8b8b8b]">
                Beta
              </span>
            </span>
            <span className="truncate text-[12px] text-[#949494]">
              {user?.notion_user_id
                ? `Account · ${user.name}`
                : "Connect a Notion account"}
            </span>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await launchDesktopLinkOAuth("notion", fetchUser);
              } catch {
                toast.error("Unable to open Notion authorization");
              }
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-[#9c9c9c] transition-colors hover:bg-white/5 hover:text-white"
          >
            <IconLink className="size-3" />
            {user?.notion_user_id ? "ReLink" : "Connect"}
          </button>
        </div>

        <DropdownMenuSeparator className="my-3 bg-white/8" />

        {/* Databases Section */}
        <div className="flex items-center gap-1.5 px-1 pb-2 text-[12px] font-semibold text-[#f0f0f0]">
          <IconDatabase className="size-3.5 text-[#8d8d8d]" />
          Databases
          <div className="ml-auto">
            <UpdateDatabasesButton />
          </div>
        </div>

        {isFetchingCurrCollectionNotionDbs ? (
          <div className="flex items-center justify-center py-5">
            <IconLoader2 className="size-4 animate-spin text-[#8d8d8d]" />
          </div>
        ) : currCollectionNotionDbs.length > 0 ? (
          currCollectionNotionDbs.map((db) => (
            <div
              key={db.uuid}
              className="flex cursor-pointer flex-col gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/[0.035]"
            >
              <div className="flex w-full items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-md bg-white/[0.07]">
                  <IconBrandNotion className="size-3.5 text-[#d5d5d5]" />
                </div>
                <span className="truncate text-[13px] font-medium text-[#e9e9e9]">
                  {db.name}
                </span>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    open(
                      `https://www.notion.so/${db.notion_database_id?.replaceAll("-", "")}`,
                    );
                  }}
                  className="rounded p-1 text-[#858585] transition-colors hover:bg-white/8 hover:text-white"
                >
                  <IconExternalLink className="text-muted-foreground size-4" />
                </div>
                <div
                  onClick={(e) => {
                    if (showDetailItem?.uuid === db?.uuid) {
                      setShowDetailItem(undefined);
                    } else {
                      setShowDetailItem(db);
                    }
                    e.stopPropagation();
                  }}
                  className={cn(
                    "ml-auto flex size-6 items-center justify-center rounded-md text-[#858585] transition-all hover:bg-white/8 hover:text-white",
                    showDetailItem?.uuid === db.uuid ? "rotate-90" : "",
                  )}
                >
                  <IconChevronRight />
                </div>
              </div>
              {showDetailItem?.uuid === db.uuid && (
                <div
                  className="mt-1 flex w-full flex-col gap-3 rounded-lg border border-white/8 bg-black/15 p-3 text-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#f0f0f0]">
                    Status mapping
                    <IconInfoCircle className="size-3.5 text-[#777]" />
                  </div>
                  <div className="flex w-full flex-col gap-2">
                    {[
                      { label: "Backlog", value: "backlog" },
                      { label: "This Week", value: "this_week" },
                      { label: "Today", value: "today" },
                      { label: "Done", value: "done" },
                    ].map((item) => (
                      <div
                        className="flex w-full items-center gap-3"
                        key={item.value}
                      >
                        <div className="w-[82px] shrink-0 text-[12px] font-medium text-[#a2a2a2]">
                          {item.label}
                        </div>
                        <StatusOptionSelector
                          setCurrDbStatusMapping={setCurrDbStatusMapping}
                          item={item}
                          currDbStatusMapping={currDbStatusMapping}
                          statusMapping={statusMapping}
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    variant={"default"}
                    size={"lg"}
                    className="mt-1 h-9 w-full rounded-lg border-0 bg-gradient-to-r from-[#47c9c4] to-[#b4ce70] text-[12px] font-semibold text-[#111] shadow-none hover:from-[#56d3cd] hover:to-[#c1d87b]"
                    onClick={async () => {
                      // 更新状态
                      const res = await updateStatusMapping(
                        showDetailItem.uuid || "",
                        currDbStatusMapping?.mapping ?? {},
                      );
                      if (res.success) {
                        toast.success("Status mapping updated successfully");
                      } else {
                        toast.error("Failed to update status mapping");
                      }
                      getCurrDbStatusMapping(showDetailItem.uuid || "");
                    }}
                  >
                    Update
                  </Button>
                </div>
              )}
            </div>
          ))
        ) : (
          <DropdownMenuItem disabled className="py-2">
            <span className="text-muted-foreground text-xs">
              No synced databases
            </span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatusOptionSelector({
  item,
  currDbStatusMapping,
  setCurrDbStatusMapping,
  statusMapping,
}: {
  item: { label: string; value: string };
  currDbStatusMapping?: Record<"mapping", Record<string, string>>;
  setCurrDbStatusMapping: (
    mapping: Record<"mapping", Record<string, string>>,
  ) => void;
  statusMapping?: string[];
}) {
  return (
    <Select
      value={currDbStatusMapping?.mapping[item.value] ?? ""}
      onValueChange={(value) => {
        // 更新 map
        setCurrDbStatusMapping({
          mapping: {
            ...currDbStatusMapping?.mapping,
            [item.value]: value,
          },
        });
      }}
    >
      <SelectTrigger className="h-8 w-full min-w-0 flex-1 rounded-md border-white/10 bg-white/[0.045] px-2.5 text-[12px] text-[#e4e4e4] hover:bg-white/[0.07]">
        <SelectValue placeholder="Select a status" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {statusMapping?.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function UpdateDatabasesButton() {
  const { user } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const {
    data: notionDatabases,
    loading,
    runAsync: fetchNotionDatabases,
  } = useRequest(
    async () => {
      const res = await searchNotionDatabases();
      return res.data;
    },
    { manual: true },
  );
  const { currCollectionNotionDbs, fetchCurrCollectionNotionDbs } =
    useCommonStore();
  const { collection } = useData();
  const [selectedDatabases, setSelectedDatabases] = useState<string[]>([]);
  return (
    <DropdownMenuSub open={isOpen}>
      <DropdownMenuSubTrigger
        onClick={() => {
          if (!isOpen && !notionDatabases?.length) {
            fetchNotionDatabases().then((res) => {
              setSelectedDatabases(
                currCollectionNotionDbs
                  .map((db) => db.notion_database_id)
                  .filter((i) => {
                    return res?.find((j) => j.database_id === i);
                  }),
              );
            });
          }
          setIsOpen((prev) => !prev);
        }}
      >
        <Button variant={"ghost"} size={"xs"}>
          Update Databases
        </Button>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="w-64 -translate-x-[158px] p-2">
          <div className="text-sm">
            <div className="flex items-center justify-between">
              <div className="text-popover-foreground">Select databases</div>
              <div className="text-muted-foreground text-xs">
                {user?.name ?? "-"}
              </div>
            </div>
            <div className="my-3 flex items-center justify-between">
              <div className="text-popover-foreground">Notion databases</div>
              <div
                className="text-muted-foreground hover:text-popover-foreground flex cursor-pointer items-center gap-1 text-xs"
                onClick={() => {
                  fetchNotionDatabases();
                }}
              >
                <IconRefresh className="size-3" />
                <div>Refresh</div>
              </div>
            </div>
            <div className="notion-list">
              <FieldGroup className="gap-3">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <IconLoader2 className="size-4 animate-spin" />
                  </div>
                ) : (
                  notionDatabases?.map((db) => (
                    <Field orientation="horizontal" key={db.id}>
                      <FieldLabel
                        htmlFor={db.id}
                        className="text-popover-foreground cursor-pointer font-normal"
                      >
                        {db.title}
                      </FieldLabel>
                      <Checkbox
                        id={db.id}
                        name={db.id}
                        checked={selectedDatabases.includes(db.id)}
                        disabled={
                          !!currCollectionNotionDbs.find(
                            (d) => d.notion_database_id === db.database_id,
                          )
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDatabases([...selectedDatabases, db.id]);
                          } else {
                            setSelectedDatabases(
                              selectedDatabases.filter((id) => id !== db.id),
                            );
                          }
                        }}
                      />
                    </Field>
                  ))
                )}
              </FieldGroup>
            </div>
            <Button
              variant={"default"}
              size={"lg"}
              className="mt-6 w-full rounded-full"
              onClick={async () => {
                const isAddDbUuids = selectedDatabases.filter(
                  (d) =>
                    !currCollectionNotionDbs.some(
                      (db) => db.notion_database_id === d,
                    ),
                );

                const isRemoveDbUuids = currCollectionNotionDbs.filter(
                  (d) => !selectedDatabases.includes(d.notion_database_id),
                );

                if (isAddDbUuids.length > 0) {
                  const isAddDbs = notionDatabases?.filter((d) =>
                    isAddDbUuids.includes(d.id),
                  );
                  const res = await Promise.all(
                    isAddDbs!.map((d) =>
                      createNotionDatabase({
                        collection_uuid: collection?.uuid ?? "",
                        notion_database_id: d.database_id,
                        name: d.title,
                        icon: d.icon,
                      }),
                    ),
                  );
                  if (res.every((r) => r.success)) {
                    toast.success("Databases updated successfully");
                    fetchNotionDatabases();
                    fetchCurrCollectionNotionDbs(collection?.uuid ?? "");
                    setIsOpen(false);
                  } else {
                    toast.error("Failed to update databases");
                  }
                }

                if (isRemoveDbUuids.length > 0) {
                  const res = await Promise.all(
                    isRemoveDbUuids.map((d) => removeNotionDatabase(d.uuid)),
                  );
                  if (res.every((r) => r.success)) {
                    toast.success("Databases removed successfully");
                    fetchNotionDatabases();
                    fetchCurrCollectionNotionDbs(collection?.uuid ?? "");
                    setIsOpen(false);
                  } else {
                    toast.error("Failed to remove databases");
                  }
                }
              }}
            >
              Update Databases
            </Button>
          </div>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
