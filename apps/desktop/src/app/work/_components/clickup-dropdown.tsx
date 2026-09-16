"use client";

import { AIconClickup } from "@/components/icons/base";
import {
  RemoteTaskImport,
  RemoteTaskImportButton,
} from "@/components/remote-task-import";
import {
  ClickUpFolder,
  ClickUpRemoteList,
  ClickUpSpace,
  ClickUpWorkspace,
  createClickUpList,
  fetchClickUpFolderLists,
  fetchClickUpFolderlessLists,
  fetchClickUpFolders,
  fetchClickUpSpaces,
  fetchClickUpStatusOptions,
  fetchClickUpWorkspaces,
  getClickUpStatusMapping,
  removeClickUpList,
  updateClickUpStatusMapping,
} from "@/services/clickup";
import { useCommonStore } from "@/stores/common";
import { useUserStore } from "@/stores/user";
import { IClickUpList } from "@/types/base";
import { Button } from "@linkdo/ui/components/button";
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
import { Field } from "@linkdo/ui/components/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@linkdo/ui/components/select";
import {
  IconChecklist,
  IconChevronRight,
  IconInfoCircle,
  IconLink,
  IconLoader2,
  IconRefresh,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useData } from "../data-provider";
import { launchDesktopLinkOAuth } from "./link-oauth";

export function ClickUpDropdown() {
  const { fetchUser } = useUserStore();
  const { collection, getTasks } = useData();
  const { currCollectionClickUpLists, isFetchingCurrCollectionClickUpLists } =
    useCommonStore();
  const [showDetailItem, setShowDetailItem] = useState<IClickUpList>();
  const [importingList, setImportingList] = useState<IClickUpList>();
  const [statusOptions, setStatusOptions] = useState<string[]>();
  const [currStatusMapping, setCurrStatusMapping] = useState<
    Record<"mapping", Record<string, string>> | undefined
  >();

  useEffect(() => {
    if (!showDetailItem?.uuid) return;
    fetchClickUpStatusOptions(showDetailItem.uuid).then((res) => {
      if (res.success) setStatusOptions(res.data);
    });
    getClickUpStatusMapping(showDetailItem.uuid).then((res) => {
      if (res.success) {
        setCurrStatusMapping(
          res.data as unknown as Record<"mapping", Record<string, string>>,
        );
      }
    });
  }, [showDetailItem?.uuid]);

  const connect = async () => {
    await launchDesktopLinkOAuth("clickup", fetchUser);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={"secondary"}
            size={"icon"}
            className="size-8 shrink-0 border-none bg-transparent"
          >
            <AIconClickup className="size-6" />
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
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="border-border bg-muted flex size-9 items-center justify-center rounded-lg border shadow-sm">
              <AIconClickup className="size-5" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-popover-foreground text-[13px] font-semibold">
                ClickUp
              </span>
              <span className="text-muted-foreground truncate text-[12px]">
                Lists linked to this collection
              </span>
            </div>
            <button
              type="button"
              onClick={connect}
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground ml-auto flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium transition-colors"
            >
              <IconLink />
              Link account
            </button>
          </div>

          <DropdownMenuSeparator className="my-3" />

          <div className="text-popover-foreground flex items-center gap-1.5 px-1 pb-2 text-[12px] font-semibold">
            <IconChecklist className="text-muted-foreground size-3.5" />
            Lists
            <div className="ml-auto">
              <UpdateClickUpListsButton />
            </div>
          </div>

          {isFetchingCurrCollectionClickUpLists ? (
            <div className="flex items-center justify-center py-2">
              <IconLoader2 className="size-4 animate-spin" />
            </div>
          ) : currCollectionClickUpLists.length > 0 ? (
            currCollectionClickUpLists.map((list) => (
              <div
                key={list.uuid}
                className="hover:bg-accent/50 flex flex-col gap-2 rounded-lg px-2 py-2.5 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-md">
                    <IconChecklist className="size-3.5" />
                  </div>
                  <span className="text-popover-foreground truncate text-[13px] font-medium">
                    {list.name}
                  </span>
                  {collection && (
                    <RemoteTaskImportButton
                      targetLabel={list.name || "Untitled list"}
                      onOpen={() => setImportingList(list)}
                    />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetailItem(
                        showDetailItem?.uuid === list.uuid ? undefined : list,
                      );
                    }}
                    className="text-muted-foreground hover:bg-accent hover:text-accent-foreground ml-auto flex size-6 cursor-pointer items-center justify-center rounded-md transition-all"
                  >
                    <IconChevronRight
                      className={
                        showDetailItem?.uuid === list.uuid ? "rotate-90" : ""
                      }
                    />
                  </button>
                </div>

                {showDetailItem?.uuid === list.uuid ? (
                  <div
                    className="border-border bg-muted/50 mt-1 flex flex-col gap-3 rounded-lg border p-3 text-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <div className="text-popover-foreground flex items-center gap-1.5 text-[12px] font-semibold">
                      Status mapping
                      <IconInfoCircle className="text-muted-foreground/70 size-3.5" />
                    </div>
                    {[
                      { label: "Backlog", value: "backlog" },
                      { label: "This Week", value: "this_week" },
                      { label: "Today", value: "today" },
                      { label: "Done", value: "done" },
                    ].map((item) => (
                      <div className="flex items-center gap-3" key={item.value}>
                        <div className="text-muted-foreground w-[82px] shrink-0 text-[12px] font-medium">
                          {item.label}
                        </div>
                        <ClickUpStatusSelector
                          item={item}
                          currStatusMapping={currStatusMapping}
                          setCurrStatusMapping={setCurrStatusMapping}
                          statusOptions={statusOptions}
                        />
                      </div>
                    ))}
                    <Button
                      variant="default"
                      size="lg"
                      className="mt-1 h-9 w-full rounded-lg border-0 text-[12px] font-semibold shadow-none"
                      onClick={async () => {
                        const res = await updateClickUpStatusMapping(
                          list.uuid,
                          currStatusMapping?.mapping ?? {},
                        );
                        if (res.success) {
                          toast.success("ClickUp status mapping updated");
                        } else {
                          toast.error("Failed to update ClickUp mapping");
                        }
                      }}
                    >
                      Update
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <DropdownMenuItem disabled className="py-2">
              <span className="text-muted-foreground text-xs">
                No linked ClickUp lists
              </span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {collection && importingList && (
        <RemoteTaskImport
          open
          collectionUuid={collection.uuid}
          target={{
            platform: "clickup",
            uuid: importingList.uuid,
            label: importingList.name || "Untitled list",
          }}
          onOpenChange={(open) => {
            if (!open) setImportingList(undefined);
          }}
          onImported={() => void getTasks()}
        />
      )}
    </>
  );
}

function ClickUpStatusSelector({
  item,
  currStatusMapping,
  setCurrStatusMapping,
  statusOptions,
}: {
  item: { label: string; value: string };
  currStatusMapping?: Record<"mapping", Record<string, string>>;
  setCurrStatusMapping: (
    mapping: Record<"mapping", Record<string, string>>,
  ) => void;
  statusOptions?: string[];
}) {
  return (
    <Select
      value={currStatusMapping?.mapping[item.value] ?? ""}
      onValueChange={(value) => {
        setCurrStatusMapping({
          mapping: {
            ...currStatusMapping?.mapping,
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
          {statusOptions?.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function UpdateClickUpListsButton() {
  const { collection } = useData();
  const { currCollectionClickUpLists, fetchCurrCollectionClickUpLists } =
    useCommonStore();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<ClickUpWorkspace[]>([]);
  const [spaces, setSpaces] = useState<ClickUpSpace[]>([]);
  const [folders, setFolders] = useState<ClickUpFolder[]>([]);
  const [folderlessLists, setFolderlessLists] = useState<ClickUpRemoteList[]>(
    [],
  );
  const [folderLists, setFolderLists] = useState<ClickUpRemoteList[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [spaceId, setSpaceId] = useState("");
  const [folderId, setFolderId] = useState("__folderless");
  const [listId, setListId] = useState("");

  const selectedList = useMemo(
    () =>
      [...folderlessLists, ...folderLists].find((item) => item.id === listId),
    [folderLists, folderlessLists, listId],
  );

  const loadWorkspaces = async () => {
    setLoading(true);
    const res = await fetchClickUpWorkspaces();
    if (res.success) {
      setWorkspaces(res.data ?? []);
    } else {
      toast.error(res.error ?? "Failed to load ClickUp workspaces");
    }
    setLoading(false);
  };

  const loadSpaces = async (nextWorkspaceId: string) => {
    setSpaces([]);
    setFolders([]);
    setFolderlessLists([]);
    setFolderLists([]);
    setSpaceId("");
    setFolderId("__folderless");
    setListId("");
    const res = await fetchClickUpSpaces(nextWorkspaceId);
    if (res.success) setSpaces(res.data ?? []);
  };

  const loadSpaceChildren = async (nextSpaceId: string) => {
    setFolders([]);
    setFolderlessLists([]);
    setFolderLists([]);
    setFolderId("__folderless");
    setListId("");
    const [folderRes, listRes] = await Promise.all([
      fetchClickUpFolders(nextSpaceId),
      fetchClickUpFolderlessLists(nextSpaceId),
    ]);
    if (folderRes.success) setFolders(folderRes.data ?? []);
    if (listRes.success) setFolderlessLists(listRes.data ?? []);
  };

  const loadFolderLists = async (nextFolderId: string) => {
    setFolderLists([]);
    setListId("");
    if (nextFolderId === "__folderless") return;
    const res = await fetchClickUpFolderLists(nextFolderId);
    if (res.success) setFolderLists(res.data ?? []);
  };

  const linkedListIds = useMemo(
    () =>
      new Set(currCollectionClickUpLists.map((item) => item.clickup_list_id)),
    [currCollectionClickUpLists],
  );

  return (
    <DropdownMenuSub open={isOpen}>
      <DropdownMenuSubTrigger
        onClick={() => {
          if (!isOpen && workspaces.length === 0) {
            loadWorkspaces();
          }
          setIsOpen((prev) => !prev);
        }}
      >
        <Button variant="ghost" size="xs">
          Update Lists
        </Button>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="w-72 -translate-x-[168px] p-2">
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-popover-foreground">
                Select ClickUp List
              </span>
              <button
                type="button"
                className="text-muted-foreground hover:text-popover-foreground flex cursor-pointer items-center gap-1 text-xs"
                onClick={loadWorkspaces}
              >
                <IconRefresh />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-2">
                <IconLoader2 className="size-4 animate-spin" />
              </div>
            ) : (
              <>
                <Field>
                  <Select
                    value={workspaceId}
                    onValueChange={(value) => {
                      setWorkspaceId(value);
                      loadSpaces(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Workspace" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {workspaces.map((workspace) => (
                          <SelectItem key={workspace.id} value={workspace.id}>
                            {workspace.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <Select
                    value={spaceId}
                    disabled={!workspaceId}
                    onValueChange={(value) => {
                      setSpaceId(value);
                      loadSpaceChildren(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Space" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {spaces.map((space) => (
                          <SelectItem key={space.id} value={space.id}>
                            {space.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <Select
                    value={folderId}
                    disabled={!spaceId}
                    onValueChange={(value) => {
                      setFolderId(value);
                      loadFolderLists(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="__folderless">No folder</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <Select
                    value={listId}
                    disabled={!spaceId}
                    onValueChange={setListId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="List" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {(folderId === "__folderless"
                          ? folderlessLists
                          : folderLists
                        ).map((list) => (
                          <SelectItem
                            key={list.id}
                            value={list.id}
                            disabled={linkedListIds.has(list.id)}
                          >
                            {list.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                {currCollectionClickUpLists.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {currCollectionClickUpLists.map((list) => (
                      <button
                        type="button"
                        key={list.uuid}
                        className="text-muted-foreground hover:text-popover-foreground flex items-center justify-between text-left text-xs"
                        onClick={async () => {
                          const res = await removeClickUpList(list.uuid);
                          if (res.success) {
                            toast.success("ClickUp list removed");
                            fetchCurrCollectionClickUpLists(
                              collection?.uuid ?? "",
                            );
                          } else {
                            toast.error("Failed to remove ClickUp list");
                          }
                        }}
                      >
                        <span className="truncate">{list.name}</span>
                        <span>Remove</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            )}

            <Button
              variant="default"
              size="lg"
              className="mt-2 w-full rounded-full"
              disabled={!workspaceId || !spaceId || !listId || !selectedList}
              onClick={async () => {
                if (!collection?.uuid || !selectedList) return;
                const res = await createClickUpList({
                  collection_uuid: collection.uuid,
                  workspace_id: workspaceId,
                  space_id: spaceId,
                  folder_id: folderId === "__folderless" ? undefined : folderId,
                  clickup_list_id: selectedList.id,
                  name: selectedList.name,
                });
                if (res.success) {
                  toast.success("ClickUp list linked");
                  fetchCurrCollectionClickUpLists(collection.uuid);
                  setIsOpen(false);
                } else {
                  toast.error(res.error ?? "Failed to link ClickUp list");
                }
              }}
            >
              Add List
            </Button>
          </div>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
