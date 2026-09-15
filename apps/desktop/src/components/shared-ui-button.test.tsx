import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@linkdo/ui/components/button";
import { Badge } from "@linkdo/ui/components/badge";

describe("shared Button", () => {
  it("renders a clickable button with the requested variant", () => {
    const onClick = vi.fn();

    render(
      <Button variant="outline" onClick={onClick}>
        Save
      </Button>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Save" }).getAttribute("data-variant")).toBe(
      "outline",
    );
  });
});

describe("shared Badge", () => {
  it("renders the requested variant", () => {
    render(<Badge variant="secondary">Beta</Badge>);

    const badge = screen.getByText("Beta");

    expect(badge.getAttribute("data-variant")).toBe("secondary");
  });
});
