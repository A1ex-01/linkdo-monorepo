// frontend/src/services/collection.ts

import type { ICollection } from "@/types/base";
import { request } from "./base";

export function getCollections() {
  return request<ICollection[]>({
    url: "/api/v1/collections",
    method: "get",
  });
}

export function getCollection(uuid: string) {
  return request<ICollection>({
    url: `/api/v1/collections/${uuid}`,
    method: "get",
  });
}

export interface CreateCollectionDTO {
  name: string;
  icon?: string;
}

export function createCollection(data: CreateCollectionDTO) {
  return request<ICollection>({
    url: "/api/v1/collections",
    method: "post",
    data,
  });
}

export interface UpdateCollectionDTO {
  name?: string;
  icon?: string;
  archived?: boolean;
}

export function updateCollection(uuid: string, data: UpdateCollectionDTO) {
  return request<void>({
    url: `/api/v1/collections/${uuid}`,
    method: "patch",
    data,
  });
}

export function deleteCollection(uuid: string) {
  return request<void>({
    url: `/api/v1/collections/${uuid}`,
    method: "delete",
  });
}

export function getTasks(collectionUuid: string) {
  return request<import("@/types/base").ITask[]>({
    url: `/api/v1/collections/${collectionUuid}/tasks`,
    method: "get",
  });
}
