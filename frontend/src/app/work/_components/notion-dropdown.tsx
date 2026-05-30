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
  exchangeCode,
  fetchStatusOptions,
  getOAuthUrl,
  getStatusMapping,
  removeNotionDatabase,
  searchNotionDatabases,
  updateStatusMapping,
} from "@/services/notion";
import { useCommonStore } from "@/stores/common";
import { useUserStore } from "@/stores/user";
import { INotionDatabase } from "@/types/base";
import { onUrl, start } from "@fabianlars/tauri-plugin-oauth";
import {
  IconBrandNotion,
  IconChevronRight,
  IconDatabase,
  IconExternalLink,
  IconInfoCircle,
  IconLink,
  IconLoader2,
  IconRefresh,
  IconUser,
} from "@tabler/icons-react";
import { open } from "@tauri-apps/plugin-shell";
import { useRequest } from "ahooks";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useData } from "../data-provider";
interface IProps {
  className: string;
}
export function NotionDropdown({ className }: IProps) {
  const { user } = useUserStore();
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
        <Button variant={"outline"} size={"icon"}>
          <IconBrandNotion className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 bg-white text-atext-500"
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
        <div className="flex items-center gap-2 py-2.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-[#dfe9f7]">
            <IconUser className="size-4 text-[#988d9f]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-atext-500">
              {user?.notion_user_id ? user.name : "Not connected"}
            </span>
            <span className="text-[10px] text-[#6b7280]">
              {user ? "Notion account" : "Click to connect Notion"}
            </span>
          </div>
          <div
            onClick={async () => {
              const port = await start({ ports: [2222] });
              await onUrl(async (url) => {
                const urlObj = new URL(url);
                const code = urlObj.searchParams.get("code");
                const res = await exchangeCode(code!);
                if (res.success) {
                  toast.success("Auth successfully");
                } else {
                  toast.error("Failed to auth");
                }
              });

              const authUrlRes = await getOAuthUrl();
              const authUrl = authUrlRes.data?.url;

              await open(authUrl!); // 打开系统浏览器
            }}
            className="ml-auto mr-2 flex cursor-pointer items-center gap-2 text-sm text-atext-450 hover:text-white"
          >
            <IconLink className="size-3" />
            {user?.notion_user_id ? "ReLink" : "Connect Notion"}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Databases Section */}
        <div className="flex items-center gap-1.5 py-2 text-[10px] font-medium uppercase tracking-wider text-[#6b7280]">
          <IconDatabase className="text-[#6b7280]" />
          My Databases
          <div className="ml-auto">
            <UpdateDatabasesButton />
          </div>
        </div>

        {isFetchingCurrCollectionNotionDbs ? (
          <div className="flex items-center justify-center">
            <IconLoader2 className="size-4 animate-spin" />
          </div>
        ) : currCollectionNotionDbs.length > 0 ? (
          currCollectionNotionDbs.map((db) => (
            <div
              key={db.uuid}
              className="flex cursor-pointer flex-col items-start gap-2 py-2"
            >
              <div className="flex w-full items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-[#dfe9f7]">
                  <IconBrandNotion className="h-3.5 w-3.5 text-atext-460" />
                </div>
                <span className="truncate text-sm text-atext-500">
                  {db.name}
                </span>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    open(
                      `https://www.notion.so/${db.notion_database_id?.replaceAll("-", "")}`,
                    );
                  }}
                  className="cursor-pointer"
                >
                  <IconExternalLink className="size-4 text-[#6b7280]" />
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
                    "ml-auto flex h-5 w-5 cursor-pointer items-center justify-center rounded text-[#6b7280] transition-colors transition-transform hover:bg-[#333] hover:text-white",
                    showDetailItem?.uuid === db.uuid ? "rotate-90" : "",
                  )}
                >
                  <IconChevronRight />
                </div>
              </div>
              {showDetailItem?.uuid === db.uuid && (
                <div
                  className="flex w-full flex-col gap-3 text-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <div className="flex items-center gap-1">
                    Status Mapping
                    <IconInfoCircle />
                  </div>
                  <div className="items flex w-full flex-col gap-3">
                    {[
                      { label: "Backlog", value: "backlog" },
                      { label: "This Week", value: "this_week" },
                      { label: "Today", value: "today" },
                      { label: "Done", value: "done" },
                    ].map((item) => (
                      <div
                        className="item flex w-full items-center"
                        key={item.value}
                      >
                        <div className="label w-20 text-white/60">
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
                    className="mt-6 w-full rounded-full"
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
            <span className="text-xs text-[#6b7280]">No synced databases</span>
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
      <SelectTrigger className="w-full max-w-48">
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
              <div>Select databases</div>
              <div className="text-xs text-atext-400">{user?.name ?? "-"}</div>
            </div>
            <div className="my-3 flex items-center justify-between">
              <div>Notion databases</div>
              <div
                className="flex cursor-pointer items-center gap-1 text-xs text-atext-450"
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
                        className="cursor-pointer font-normal text-atext-450"
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
