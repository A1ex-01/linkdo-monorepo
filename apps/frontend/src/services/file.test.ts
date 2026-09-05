import { describe, expect, it } from "vitest";
import { createImageUploadForm } from "./file";

describe("createImageUploadForm", () => {
  it("sends the selected image and purpose without an OSS URL", () => {
    const file = new File(["image"], "avatar.png", { type: "image/png" });
    const form = createImageUploadForm(file, "avatars");
    expect(form.get("file")).toBe(file);
    expect(form.get("purpose")).toBe("avatars");
  });
});
