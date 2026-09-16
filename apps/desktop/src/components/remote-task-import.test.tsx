import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { RemoteTaskImport } from "./remote-task-import";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const getCandidates = vi.fn().mockResolvedValue({
  success: true,
  data: [
    { remote_id: "page-1", title: "Plan launch", remote_status: "In progress" },
    { remote_id: "page-2", title: "Write announcement", remote_status: "Todo" },
  ],
});
const importTasks = vi.fn().mockResolvedValue({ success: true, data: [] });

vi.mock("@/services/task", () => ({
  getRemoteImportCandidates: (...args: unknown[]) => getCandidates(...args),
  importRemoteTasks: (...args: unknown[]) => importTasks(...args),
}));

vi.mock("@linkdo/ui/components/button", () => ({
  Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props} />
  ),
}));
vi.mock("@linkdo/ui/components/checkbox", () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
    ...props
  }: {
    checked?: boolean;
    onCheckedChange?: (value: boolean) => void;
  } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      {...props}
    />
  ),
}));
vi.mock("@linkdo/ui/components/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));
vi.mock("@linkdo/ui/components/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("@linkdo/ui/components/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectGroup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectTrigger: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button role="combobox" {...props}>
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder}</span>
  ),
}));

describe("RemoteTaskImport", () => {
  it("loads a source's unfinished items and imports only the checked items into its target column", async () => {
    const onImported = vi.fn();
    render(
      <RemoteTaskImport
        open
        collectionUuid="collection-uuid"
        target={{ platform: "notion", uuid: "db-1", label: "Roadmap" }}
        onOpenChange={vi.fn()}
        onImported={onImported}
      />,
    );

    expect(await screen.findByText("Plan launch")).toBeTruthy();
    expect(
      screen.getByRole("combobox", { name: "Target position" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: "Plan launch" }));
    expect(
      screen.getByRole("button", { name: "Add Selected Cards (1)" }),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Add Selected Cards (1)" }),
    );

    await waitFor(() =>
      expect(importTasks).toHaveBeenCalledWith("collection-uuid", {
        source: "notion",
        notion_database_uuid: "db-1",
        status: "backlog",
        prev_rank: "",
        next_rank: "",
        items: [{ remote_id: "page-1", title: "Plan launch" }],
      }),
    );
    expect(onImported).toHaveBeenCalledOnce();
  });
});
