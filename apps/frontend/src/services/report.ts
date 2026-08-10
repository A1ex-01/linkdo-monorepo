// frontend/src/services/report.ts

import type {
  ICollectionBreakdown,
  IReportQuery,
  IReportSummary,
  ITimelinePoint,
} from "@/types/base";
import { request } from "./base";

/**
 * Convert an IReportQuery to a URL-encoded query string.
 * `collection_uuids` is repeated as multiple `collection_uuids` params
 * (the backend accepts both repeated and comma-separated forms).
 */
function toQueryString(q?: IReportQuery): string {
  if (!q) return "";
  const params = new URLSearchParams();
  if (q.start_date) params.set("start_date", q.start_date);
  if (q.end_date) params.set("end_date", q.end_date);
  if (q.collection_uuids && q.collection_uuids.length > 0) {
    for (const uuid of q.collection_uuids) {
      params.append("collection_uuids", uuid);
    }
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function getReportSummary(query?: IReportQuery) {
  return request<IReportSummary>({
    url: `/api/reports/summary${toQueryString(query)}`,
    method: "get",
  });
}

export function getReportBreakdown(query?: IReportQuery) {
  return request<ICollectionBreakdown[]>({
    url: `/api/reports/breakdown${toQueryString(query)}`,
    method: "get",
  });
}

export function getReportTimeline(query?: IReportQuery) {
  return request<ITimelinePoint[]>({
    url: `/api/reports/timeline${toQueryString(query)}`,
    method: "get",
  });
}
