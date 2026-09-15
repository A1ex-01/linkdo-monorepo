"use client";

import { useCommonStore } from "@/stores/common";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Content from "./content";
import { DataProvider } from "./data-provider";

export default function WorkPage() {
  const searchParams = useSearchParams();
  const collectionUuid = searchParams.get("uuid");
  const { fetchCurrCollectionNotionDbs, fetchCurrCollectionClickUpLists } =
    useCommonStore();

  useEffect(() => {
    if (collectionUuid) {
      fetchCurrCollectionNotionDbs(collectionUuid);
      fetchCurrCollectionClickUpLists(collectionUuid);
    }
  }, [collectionUuid, fetchCurrCollectionClickUpLists, fetchCurrCollectionNotionDbs]);
  return (
    <DataProvider>
      <Content />
    </DataProvider>
  );
}
