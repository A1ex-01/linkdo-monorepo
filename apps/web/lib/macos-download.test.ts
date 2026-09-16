import assert from "node:assert/strict";
import test from "node:test";
import {
  getDownloadClickEndpoint,
  getMacOSDownloadUrl,
  getWindowsDownloadUrl,
  isMacOS,
} from "./macos-download.ts";

test("identifies macOS browsers", () => {
  assert.equal(
    isMacOS(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    ),
    true,
  );
});

test("rejects browsers on unsupported operating systems", () => {
  assert.equal(
    isMacOS("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"),
    false,
  );
  assert.equal(isMacOS("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"), false);
});

test("accepts only secure macOS installer URLs", () => {
  assert.equal(
    getMacOSDownloadUrl("https://downloads.linkdo.app/Linkdo.dmg"),
    "https://downloads.linkdo.app/Linkdo.dmg",
  );
  assert.equal(getMacOSDownloadUrl("http://downloads.linkdo.app/Linkdo.dmg"), null);
  assert.equal(getMacOSDownloadUrl("not a URL"), null);
});

test("accepts only secure Windows installer URLs", () => {
  assert.equal(
    getWindowsDownloadUrl("https://downloads.linkdo.app/Linkdo-setup.exe"),
    "https://downloads.linkdo.app/Linkdo-setup.exe",
  );
  assert.equal(getWindowsDownloadUrl("http://downloads.linkdo.app/Linkdo-setup.exe"), null);
});

test("uses the public API endpoint when download reporting is not configured", () => {
  assert.equal(
    getDownloadClickEndpoint(undefined),
    "https://api.a1ex.online/api/download-clicks",
  );
});
