import type { IClickUpList } from "@/types/base";
import { getClickUpResources } from "./link";
import { request } from "./base";

export interface ClickUpWorkspace {
  id: string;
  name: string;
}

export interface ClickUpSpace {
  id: string;
  name: string;
}

export interface ClickUpFolder {
  id: string;
  name: string;
}

export interface ClickUpRemoteList {
  id: string;
  name: string;
}

export interface CreateClickUpListDTO {
  collection_uuid: string;
  workspace_id: string;
  space_id: string;
  folder_id?: string;
  clickup_list_id: string;
  name: string;
}

function readArray<T>(payload: Record<string, unknown>, key: string): T[] {
  const value = payload[key];
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function fetchClickUpWorkspaces() {
  const response = await getClickUpResources("team");
  return {
    ...response,
    data: response.success
      ? readArray<ClickUpWorkspace>(response.data ?? {}, "teams")
      : [],
  };
}

export async function fetchClickUpSpaces(workspaceId: string) {
  const response = await getClickUpResources(`team/${workspaceId}/space`);
  return {
    ...response,
    data: response.success
      ? readArray<ClickUpSpace>(response.data ?? {}, "spaces")
      : [],
  };
}

export async function fetchClickUpFolders(spaceId: string) {
  const response = await getClickUpResources(`space/${spaceId}/folder`);
  return {
    ...response,
    data: response.success
      ? readArray<ClickUpFolder>(response.data ?? {}, "folders")
      : [],
  };
}

export async function fetchClickUpFolderlessLists(spaceId: string) {
  const response = await getClickUpResources(`space/${spaceId}/list`);
  return {
    ...response,
    data: response.success
      ? readArray<ClickUpRemoteList>(response.data ?? {}, "lists")
      : [],
  };
}

export async function fetchClickUpFolderLists(folderId: string) {
  const response = await getClickUpResources(`folder/${folderId}/list`);
  return {
    ...response,
    data: response.success
      ? readArray<ClickUpRemoteList>(response.data ?? {}, "lists")
      : [],
  };
}

export function getClickUpLists() {
  return request<IClickUpList[]>({
    url: "/api/clickup-lists",
    method: "get",
  });
}

export function getClickUpListsByCollection(collectionUuid: string) {
  return request<IClickUpList[]>({
    url: `/api/collections/${collectionUuid}/clickup-lists`,
    method: "get",
  });
}

export function createClickUpList(data: CreateClickUpListDTO) {
  return request<IClickUpList>({
    url: "/api/clickup-lists",
    method: "post",
    data,
  });
}

export function removeClickUpList(clickUpListUuid: string) {
  return request<void>({
    url: `/api/clickup-lists/${clickUpListUuid}`,
    method: "delete",
  });
}

export function getClickUpStatusMapping(clickUpListUuid: string) {
  return request<{ mapping: Record<string, string> }>({
    url: `/api/clickup-lists/${clickUpListUuid}/status-mapping`,
    method: "get",
  });
}

export function updateClickUpStatusMapping(
  clickUpListUuid: string,
  mapping: Record<string, string>,
) {
  return request<void>({
    url: `/api/clickup-lists/${clickUpListUuid}/status-mapping`,
    method: "put",
    data: { mapping },
  });
}

export function fetchClickUpStatusOptions(clickUpListUuid: string) {
  return request<string[]>({
    url: `/api/clickup-lists/${clickUpListUuid}/status-mapping/fetch`,
    method: "post",
  });
}
