import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

afterEach(() => cleanup());

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
  it("does not request remote cards until status mapping is complete", () => {
    const onConfigureStatusMapping = vi.fn();
    render(
      <RemoteTaskImport
        collectionUuid="collection-uuid"
        target={{ platform: "notion", uuid: "db-1", label: "Roadmap" }}
        onConfigureStatusMapping={onConfigureStatusMapping}
        statusMappingComplete={false}
        onImported={vi.fn()}
      />,
    );

    expect(getCandidates).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Configure status mapping" }),
    );
    expect(onConfigureStatusMapping).toHaveBeenCalledOnce();
  });

  it("loads unfinished items inline without requiring a dialog open state", async () => {
    render(
      <RemoteTaskImport
        collectionUuid="collection-uuid"
        target={{ platform: "clickup", uuid: "list-1", label: "Sprint" }}
        onImported={vi.fn()}
      />,
    );

    expect(await screen.findByText("Plan launch")).toBeTruthy();
    expect(screen.queryByText("Import unfinished tasks")).toBeNull();
  });

  it("groups cards by remote status and filters them by title", async () => {
    render(
      <RemoteTaskImport
        collectionUuid="collection-uuid"
        target={{ platform: "notion", uuid: "db-1", label: "Roadmap" }}
        onImported={vi.fn()}
      />,
    );

    expect(await screen.findByText("In progress")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Search cards"), {
      target: { value: "announcement" },
    });

    expect(screen.queryByText("Plan launch")).toBeNull();
    expect(screen.getByText("Write announcement")).toBeTruthy();
  });

  it("imports checked cards without asking the user to choose a local column", async () => {
    const onImported = vi.fn();
    render(
      <RemoteTaskImport
        collectionUuid="collection-uuid"
        target={{ platform: "notion", uuid: "db-1", label: "Roadmap" }}
        onImported={onImported}
      />,
    );

    expect(await screen.findByText("Plan launch")).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: "Target position" })).toBeNull();
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
        items: [{ remote_id: "page-1", title: "Plan launch" }],
      }),
    );
    expect(onImported).toHaveBeenCalledOnce();
  });
});
