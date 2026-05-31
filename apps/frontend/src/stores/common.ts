// frontend/src/stores/use-auth-store.ts

import { getNotionDatabasesByCollection } from "@/services/notion";
import { INotionDatabase } from "@/types/base";
import { create } from "zustand";
import { createLogger } from "@/utils/logger";

const logger = createLogger("common-store");

interface IST {
  isFetchingCurrCollectionNotionDbs: boolean;
  currCollectionNotionDbs: INotionDatabase[];
  fetchCurrCollectionNotionDbs: (collectionUUID: string) => Promise<void>;
}

export const useCommonStore = create<IST>((set) => ({
  isFetchingCurrCollectionNotionDbs: false,
  currCollectionNotionDbs: [],
  fetchCurrCollectionNotionDbs: async (collectionUUID: string) => {
    set({ isFetchingCurrCollectionNotionDbs: true });
    const response = await getNotionDatabasesByCollection(collectionUUID);
    if (response.success) {
      set({ currCollectionNotionDbs: response.data });
    } else {
      logger.error(response.error);
    }
    set({ isFetchingCurrCollectionNotionDbs: false });
  },
}));
