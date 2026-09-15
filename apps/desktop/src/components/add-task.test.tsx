import { fireEvent, render, screen } from "@testing-library/react";
import { format } from "date-fns";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { AddTask } from "./add-task";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

vi.mock("@/app/work/data-provider", () => ({
  useData: () => ({ createTaskOptimistic: vi.fn() }),
}));

vi.mock("@/stores/common", () => ({
  useCommonStore: () => ({
    currCollectionNotionDbs: [],
    currCollectionClickUpLists: [],
  }),
}));

describe("AddTask", () => {
  it("opens with a 30-minute countdown and today's date selected", () => {
    render(<AddTask status="today" />);

    fireEvent.click(screen.getByRole("button", { name: /add task/i }));

    expect(screen.getByRole("radiogroup", { name: "计时模式" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "倒计时" })).toHaveProperty(
      "ariaChecked",
      "true",
    );
    expect(screen.getByLabelText("Expected duration")).toHaveProperty(
      "value",
      "00:30",
    );
    expect(
      screen.getByRole("button", { name: format(new Date(), "yyyy-MM-dd") }),
    ).toBeTruthy();
  });
});
