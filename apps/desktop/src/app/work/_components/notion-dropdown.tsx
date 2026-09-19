import { AIconNotion } from "@/components/icons/base";
import { RemoteTaskImport } from "@/components/remote-task-import";
import { hasCompleteStatusMapping } from "@/lib/status-mapping";
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
import { Button } from "@linkdo/ui/components/button";
import { Checkbox } from "@linkdo/ui/components/checkbox";
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
} from "@linkdo/ui/components/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@linkdo/ui/components/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@linkdo/ui/components/select";
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

type DetailTab = "cards" | "settings";

export function NotionDropdown({ className }: IProps) {
  const { user, fetchUser } = useUserStore();
  const { collection, getTasks } = useData();
  const { currCollectionNotionDbs, isFetchingCurrCollectionNotionDbs } =
    useCommonStore();
  const [showDetailItem, setShowDetailItem] = useState<INotionDatabase>();
  const [detailTab, setDetailTab] = useState<DetailTab>("cards");
  const [statusMapping, setStatusMapping] = useState<string[] | undefined>();
  const [currDbStatusMapping, setCurrDbStatusMapping] = useState<
    Record<"mapping", Record<string, string>> | undefined
  >();
  const [savedDbStatusMapping, setSavedDbStatusMapping] = useState<
    Record<"mapping", Record<string, string>> | undefined
  >();
  const [isStatusMappingLoading, setIsStatusMappingLoading] = useState(false);

  const getCurrItemStatusMapping = async (database_id: string) => {
    const res = await fetchStatusOptions(database_id);
    if (res.success) {
      setStatusMapping(res.data);
    }
  };
  const getCurrDbStatusMapping = async (database_id: string) => {
    setIsStatusMappingLoading(true);
    try {
      const res = await getStatusMapping(database_id);
      if (res.success) {
        const mapping = res.data as unknown as Record<
          "mapping",
          Record<string, string>
        >;
        setCurrDbStatusMapping(mapping);
        setSavedDbStatusMapping(mapping);
      }
    } finally {
      setIsStatusMappingLoading(false);
    }
  };

  useEffect(() => {
    if (showDetailItem?.uuid) {
      getCurrDbStatusMapping(showDetailItem?.uuid);
    }
  }, [showDetailItem?.uuid]);

  useEffect(() => {
    if (showDetailItem?.uuid && detailTab === "settings") {
      getCurrItemStatusMapping(showDetailItem.uuid);
    }
  }, [detailTab, showDetailItem?.uuid]);

  const isStatusMappingComplete = hasCompleteStatusMapping(
    savedDbStatusMapping?.mapping,
  );

  useEffect(() => {
    if (
      showDetailItem?.uuid &&
      !isStatusMappingLoading &&
      !isStatusMappingComplete &&
      detailTab === "cards"
    ) {
      setDetailTab("settings");
    }
  }, [
    detailTab,
    isStatusMappingComplete,
    isStatusMappingLoading,
    showDetailItem?.uuid,
  ]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={"secondary"}
            size={"icon"}
            className="size-8 shrink-0 border-none bg-transparent"
          >
            <AIconNotion alt="Notion" className="size-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border-border bg-popover text-popover-foreground w-[380px] overflow-hidden rounded-xl border p-3 shadow-2xl"
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
            <div className="border-border bg-muted flex size-9 items-center justify-center rounded-lg border shadow-sm">
              <AIconNotion alt="" className="size-5" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-popover-foreground text-[13px] font-semibold">
                Notion{" "}
                <span className="text-muted-foreground/70 ml-1 text-[10px] font-medium">
                  Beta
                </span>
              </span>
              <span className="text-muted-foreground truncate text-[12px]">
                {user?.notion_user_id
                  ? `Account · ${user.name}`
                  : "Connect a Notion account"}
              </span>
            </div>
            <button
              type="button"
              onClick={async () => {
                await launchDesktopLinkOAuth("notion", fetchUser);
              }}
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium transition-colors"
            >
              <IconLink className="size-3" />
              {user?.notion_user_id ? "ReLink" : "Connect"}
            </button>
          </div>

          <DropdownMenuSeparator className="my-3" />

          {/* Databases Section */}
          <div className="text-popover-foreground flex items-center gap-1.5 px-1 pb-2 text-[12px] font-semibold">
            <IconDatabase className="text-muted-foreground size-3.5" />
            Databases
            <div className="ml-auto">
              <UpdateDatabasesButton />
            </div>
          </div>

          {isFetchingCurrCollectionNotionDbs ? (
            <div className="flex items-center justify-center py-5">
              <IconLoader2 className="text-muted-foreground size-4 animate-spin" />
            </div>
          ) : currCollectionNotionDbs.length > 0 ? (
            currCollectionNotionDbs.map((db) => (
              <div
                key={db.uuid}
                className="hover:bg-accent/50 flex cursor-pointer flex-col gap-2 rounded-lg px-2 py-2.5 transition-colors"
              >
                <div className="flex w-full items-center gap-2">
                  <div className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-md">
                    <IconBrandNotion className="size-3.5" />
                  </div>
                  <span className="text-popover-foreground truncate text-[13px] font-medium">
                    {db.name}
                  </span>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      open(
                        `https://www.notion.so/${db.notion_database_id?.replaceAll("-", "")}`,
                      );
                    }}
                    className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded p-1 transition-colors"
                  >
                    <IconExternalLink className="text-muted-foreground size-4" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      if (showDetailItem?.uuid === db?.uuid) {
                        setShowDetailItem(undefined);
                      } else {
                        setCurrDbStatusMapping(undefined);
                        setSavedDbStatusMapping(undefined);
                        setStatusMapping(undefined);
                        setIsStatusMappingLoading(true);
                        setShowDetailItem(db);
                        setDetailTab("cards");
                      }
                      e.stopPropagation();
                    }}
                    className={cn(
                      "text-muted-foreground hover:bg-accent hover:text-accent-foreground ml-auto flex size-6 items-center justify-center rounded-md transition-all",
                      showDetailItem?.uuid === db.uuid ? "rotate-90" : "",
                    )}
                  >
                    <IconChevronRight className="size-4" />
                  </button>
                </div>
                {showDetailItem?.uuid === db.uuid && (
                  <div
                    className="border-border bg-muted/50 mt-1 flex w-full flex-col gap-4 rounded-lg border p-3 text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div
                      aria-label={`${db.name || "Database"} detail tabs`}
                      className="border-border grid grid-cols-2 rounded-lg border p-1"
                      role="tablist"
                    >
                      {(["cards", "settings"] as DetailTab[]).map((tab) => (
                        <button
                          aria-selected={detailTab === tab}
                          className={cn(
                            "text-muted-foreground rounded-md px-3 py-2 text-[12px] font-semibold capitalize transition-colors",
                            detailTab === tab &&
                              "bg-card text-foreground shadow-sm",
                          )}
                          key={tab}
                          onClick={() => {
                            if (
                              tab === "cards" &&
                              !isStatusMappingLoading &&
                              !isStatusMappingComplete
                            ) {
                              setDetailTab("settings");
                              return;
                            }
                            setDetailTab(tab);
                          }}
                          role="tab"
                          type="button"
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {detailTab === "cards" ? (
                      isStatusMappingLoading ? (
                        <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
                          <IconLoader2 className="size-4 animate-spin" />
                          Checking status mapping…
                        </div>
                      ) : collection ? (
                        <RemoteTaskImport
                          collectionUuid={collection.uuid}
                          target={{
                            platform: "notion",
                            uuid: db.uuid,
                            label: db.name || db.title || "Untitled database",
                          }}
                          onConfigureStatusMapping={() =>
                            setDetailTab("settings")
                          }
                          onImported={() => void getTasks()}
                          statusMappingComplete={isStatusMappingComplete}
                        />
                      ) : null
                    ) : (
                      <>
                        <div className="text-popover-foreground flex items-center gap-1.5 text-[12px] font-semibold">
                          Status mapping
                          <IconInfoCircle className="text-muted-foreground/70 size-3.5" />
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
                              <div className="text-muted-foreground w-[82px] shrink-0 text-[12px] font-medium">
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
                          className="mt-1 h-9 w-full rounded-lg border-0 text-[12px] font-semibold shadow-none"
                          onClick={async () => {
                            const res = await updateStatusMapping(
                              showDetailItem.uuid || "",
                              currDbStatusMapping?.mapping ?? {},
                            );
                            if (res.success) {
                              setSavedDbStatusMapping(currDbStatusMapping);
                              toast.success(
                                "Status mapping updated successfully",
                              );
                            } else {
                              toast.error("Failed to update status mapping");
                            }
                            getCurrDbStatusMapping(showDetailItem.uuid || "");
                          }}
                        >
                          Update
                        </Button>
                      </>
                    )}
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
    </>
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
      <SelectTrigger className="border-input bg-background hover:bg-accent h-8 w-full min-w-0 flex-1 rounded-md px-2.5 text-[12px]">
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
