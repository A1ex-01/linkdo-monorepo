"use client";

import { AIconClickup } from "@/components/icons/base";
import { Button } from "@/components/ui/button";
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
import { Field } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const { currCollectionClickUpLists, isFetchingCurrCollectionClickUpLists } =
    useCommonStore();
  const [showDetailItem, setShowDetailItem] = useState<IClickUpList>();
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
    try {
      await launchDesktopLinkOAuth("clickup", fetchUser);
    } catch {
      toast.error("Unable to open ClickUp authorization");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="ClickUp settings"
          className="border-border bg-card hover:bg-accent"
        >
          <AIconClickup />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80"
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (e.target instanceof HTMLElement) {
            if (e.target.closest("[data-radix-select-content]")) {
              e.preventDefault();
            }
          }
        }}
      >
        <div className="flex items-center gap-2 py-2">
          <div className="bg-muted flex size-8 items-center justify-center rounded-full">
            <IconChecklist />
          </div>
          <div className="flex flex-col">
            <span className="text-popover-foreground text-xs font-semibold">
              ClickUp
            </span>
            <span className="text-muted-foreground text-[10px]">
              Lists linked to this collection
            </span>
          </div>
          <button
            type="button"
            onClick={connect}
            className="text-muted-foreground hover:text-popover-foreground ml-auto flex cursor-pointer items-center gap-2 text-sm"
          >
            <IconLink />
            Connect
          </button>
        </div>

        <DropdownMenuSeparator />

        <div className="text-muted-foreground flex items-center gap-1.5 py-2 text-[10px] font-medium tracking-wider uppercase">
          <IconChecklist />
          My Lists
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
            <div key={list.uuid} className="flex flex-col gap-2 py-2">
              <div className="flex items-center gap-2">
                <div className="bg-muted flex size-6 items-center justify-center rounded">
                  <IconChecklist />
                </div>
                <span className="text-popover-foreground truncate text-sm">
                  {list.name}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetailItem(
                      showDetailItem?.uuid === list.uuid ? undefined : list,
                    );
                  }}
                  className="text-muted-foreground hover:bg-accent hover:text-accent-foreground ml-auto flex size-5 cursor-pointer items-center justify-center rounded transition-all"
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
                  className="flex flex-col gap-3 text-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <div className="text-popover-foreground flex items-center gap-1">
                    Status Mapping
                    <IconInfoCircle />
                  </div>
                  {[
                    { label: "Backlog", value: "backlog" },
                    { label: "This Week", value: "this_week" },
                    { label: "Today", value: "today" },
                    { label: "Done", value: "done" },
                  ].map((item) => (
                    <div className="flex items-center" key={item.value}>
                      <div className="text-popover-foreground w-20">
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
                    className="mt-3 w-full rounded-full"
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
      <SelectTrigger className="w-full max-w-48">
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
