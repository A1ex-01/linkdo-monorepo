// frontend/src/services/notion.ts

import type { INotionDatabase } from "@/types/base";
import { request } from "./base";

export interface SearchNotionDatabaseResult {
  id: string;
  title: string;
  database_id: string;
  icon: string;
}

export function searchNotionDatabases(query?: string) {
  return request<SearchNotionDatabaseResult[]>({
    url: "/api/notion/databases",
    method: "get",
    params: query ? { query } : undefined,
  });
}

export function getNotionDatabases() {
  return request<INotionDatabase[]>({
    url: "/api/notion-databases",
    method: "get",
  });
}

export function getNotionDatabasesByCollection(collectionUuid: string) {
  return request<INotionDatabase[]>({
    url: `/api/collections/${collectionUuid}/notion-databases`,
    method: "get",
  });
}

export interface CreateNotionDatabaseDTO {
  collection_uuid: string;
  notion_database_id: string;
  name: string;
  icon?: string;
}

export function createNotionDatabase(data: CreateNotionDatabaseDTO) {
  return request<INotionDatabase>({
    url: "/api/notion-databases",
    method: "post",
    data,
  });
}

export function getStatusMapping(notionDbUuid: string) {
  return request<{
    notion_options: string[];
    mapping: Record<string, string>;
  }>({
    url: `/api/notion-databases/${notionDbUuid}/status-mapping`,
    method: "get",
  });
}

export function updateStatusMapping(
  notionDbUuid: string,
  mapping: Record<string, string>,
) {
  return request<void>({
    url: `/api/notion-databases/${notionDbUuid}/status-mapping`,
    method: "put",
    data: { mapping },
  });
}

export function fetchStatusOptions(notionDbUuid: string) {
  return request<string[]>({
    url: `/api/notion-databases/${notionDbUuid}/status-mapping/fetch`,
    method: "post",
  });
}

export function getOAuthUrl() {
  return request<{ url: string }>({
    url: "/api/notion/url",
    method: "get",
  });
}

export function exchangeCode(code: string) {
  return request<{ url: string }>({
    url: "/api/notion/callback",
    method: "get",
    params: { code },
  });
}

export function removeNotionDatabase(notionDbUuid: string) {
  return request<void>({
    url: `/api/notion-databases/${notionDbUuid}`,
    method: "delete",
  });
}
