import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("How It Works presents the six recorded Linkdo workflows", async () => {
  const source = await readFile(
    new URL("./how-it-works-section.tsx", import.meta.url),
    "utf8",
  );

  for (const video of [
    "http://static.a1ex.online/linkdo/videos/how-it-works/01-categories.mp4",
    "http://static.a1ex.online/linkdo/videos/how-it-works/02-plan.mp4",
    "http://static.a1ex.online/linkdo/videos/how-it-works/03-notion.mp4",
    "http://static.a1ex.online/linkdo/videos/how-it-works/04-focus.mp4",
    "http://static.a1ex.online/linkdo/videos/how-it-works/05-reports.mp4",
    "http://static.a1ex.online/linkdo/videos/how-it-works/06-theme.mp4",
  ]) {
    assert.ok(source.includes(video), `missing ${video}`);
  }

  for (const label of [
    "任务分类",
    "规划每周 / 每天",
    "链接集成服务",
    "进入专注模式",
    "完成任务",
    "主题切换",
  ]) {
    assert.ok(source.includes(label), `missing ${label}`);
  }

  assert.ok(source.includes("src={steps[active].video}"));
  assert.ok(source.includes("object-contain"));
});
