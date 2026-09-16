// desktop/src/stores/use-auth-store.ts

import { getNotionDatabasesByCollection } from "@/services/notion";
import { getClickUpListsByCollection } from "@/services/clickup";
import { IClickUpList, INotionDatabase } from "@/types/base";
import { create } from "zustand";

interface IST {
  isFetchingCurrCollectionNotionDbs: boolean;
  currCollectionNotionDbs: INotionDatabase[];
  fetchCurrCollectionNotionDbs: (collectionUUID: string) => Promise<void>;
  isFetchingCurrCollectionClickUpLists: boolean;
  currCollectionClickUpLists: IClickUpList[];
  fetchCurrCollectionClickUpLists: (collectionUUID: string) => Promise<void>;
}

export const useCommonStore = create<IST>((set) => ({
  isFetchingCurrCollectionNotionDbs: false,
  currCollectionNotionDbs: [],
  isFetchingCurrCollectionClickUpLists: false,
  currCollectionClickUpLists: [],
  fetchCurrCollectionNotionDbs: async (collectionUUID: string) => {
    set({ isFetchingCurrCollectionNotionDbs: true });
    const response = await getNotionDatabasesByCollection(collectionUUID);
    if (response.success) {
      set({ currCollectionNotionDbs: response.data });
    } else {
      console.error(response.error);
    }
    set({ isFetchingCurrCollectionNotionDbs: false });
  },
  fetchCurrCollectionClickUpLists: async (collectionUUID: string) => {
    set({ isFetchingCurrCollectionClickUpLists: true });
    const response = await getClickUpListsByCollection(collectionUUID);
    if (response.success) {
      set({ currCollectionClickUpLists: response.data });
    } else {
      console.error(response.error);
    }
    set({ isFetchingCurrCollectionClickUpLists: false });
  },
}));
