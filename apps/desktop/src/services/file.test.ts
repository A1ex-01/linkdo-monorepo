import { describe, expect, it } from "vitest";
import { createImageUploadForm, resolveFilePath } from "./file";

describe("createImageUploadForm", () => {
  it("sends the selected image and purpose without an OSS URL", () => {
    const file = new File(["image"], "avatar.png", { type: "image/png" });
    const form = createImageUploadForm(file, "avatars");
    expect(form.get("file")).toBe(file);
    expect(form.get("purpose")).toBe("avatars");
  });
});

describe("resolveFilePath", () => {
  it("renders stored OSS paths with the default public base URL", () => {
    expect(resolveFilePath("collection-covers/user-1/cover.png")).toBe(
      "https://a-linkdo.oss-cn-shanghai.aliyuncs.com/collection-covers/user-1/cover.png",
    );
  });
});
