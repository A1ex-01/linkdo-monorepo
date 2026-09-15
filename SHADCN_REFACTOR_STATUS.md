# Shadcn 主题重构进度

## 目标
将所有硬编码颜色和自定义 CSS 变量替换为 shadcn 主题系统，实现一键主题切换。

## 已完成 ✅

### 核心页面组件
- ✅ `apps/desktop/src/app/page.tsx` - 根页面背景
- ✅ `apps/desktop/src/app/home/page.tsx` - 首页（已在之前完成）
- ✅ `apps/desktop/src/app/home/_components/collection-card.tsx` - 集合卡片
- ✅ `apps/desktop/src/app/home/_components/create-collection-modal.tsx` - 创建集合弹窗
- ✅ `apps/desktop/src/app/work/content.tsx` - 工作区容器
- ✅ `apps/desktop/src/app/login/page.tsx` - 登录页（移除所有 `text-atext-*` 变量）

### 通用组件
- ✅ `apps/desktop/src/components/bottom-nav.tsx` - 底部导航
- ✅ `apps/desktop/src/components/window-title-bar.tsx` - 窗口标题栏
- ✅ `apps/desktop/src/components/account-settings-dialog.tsx` - 账户设置弹窗
- ✅ `apps/desktop/src/components/theme-toggle.tsx` - 主题切换按钮（新增）
- ✅ `apps/desktop/src/providers/base.tsx` - Toast 通知样式

## 待处理 ⏳

### 高优先级（大量硬编码）
1. **Reports 页面**（最复杂，约 60+ 处硬编码）
   - `apps/desktop/src/app/reports/page.tsx` - 主页面
   - `apps/desktop/src/app/reports/_components/report-timeline-chart.tsx` - 时间线图表
   - `apps/desktop/src/app/reports/_components/report-summary-cards.tsx` - 汇总卡片
   - `apps/desktop/src/app/reports/_components/report-collection-table.tsx` - 表格

2. **AI Chat 组件**（约 15+ 处 rgba/十六进制）
   - `apps/desktop/src/components/ai-chat/index.tsx` - 主聊天界面

3. **Work 子组件**
   - `apps/desktop/src/app/work/_components/kanban-board.tsx`
   - `apps/desktop/src/app/work/_components/header.tsx`
   - `apps/desktop/src/app/work/_components/sidebar-board.tsx`
   - `apps/desktop/src/app/work/_components/task-search.tsx`
   - `apps/desktop/src/app/work/_components/apps-dropdown.tsx`
   - `apps/desktop/src/app/work/_components/clickup-dropdown.tsx`
   - `apps/desktop/src/app/work/_components/notion-dropdown.tsx`

### 中优先级
4. **其他组件**
   - `apps/desktop/src/components/a-markdown-editor.tsx` - Markdown 编辑器
   - `apps/desktop/src/components/agents/message-bubble.tsx` - 消息气泡
   - `apps/desktop/src/components/motion/popover-morph.tsx` - 弹窗动画

## Shadcn 主题变量映射指南

### 常用颜色映射
```tsx
// 背景色
bg-[#111111] / bg-[#171717] → bg-background
bg-[#1c1c1e] / bg-[#202022] → bg-muted
bg-[#2a2a2a] / bg-[#252525] → bg-secondary

// 文字颜色
text-white / text-[#f4f4f5] → text-foreground
text-[#8d8d92] / text-[#77777d] → text-muted-foreground
text-[#b0b0b0] / text-[#98989e] → text-muted-foreground

// 边框
border-[#363636] / border-[#3b3b3b] → border-border
border-white/[0.08] → border-border

// 输入框
bg-[#252525] → bg-input
text-white → text-foreground
placeholder:text-[#69696f] → placeholder:text-muted-foreground

// 按钮
bg-white text-black → bg-primary text-primary-foreground
bg-[#2a2a2a] hover:bg-[#363636] → bg-secondary hover:bg-secondary/80

// 重点色（蓝色/紫色品牌色）
text-blue-400 / bg-[#4f79e8] → text-primary / bg-primary
border-[#8a4fd7] → border-primary
```

### 自定义变量移除清单
所有 `text-atext-*` 变量已从 globals.css 删除，需替换为：
- `text-atext-500` → `text-foreground`
- `text-atext-460` → `text-muted-foreground`
- `text-atext-450` → `text-muted-foreground`
- `text-atext-400` → `text-muted-foreground/80`
- `text-atext-300` → `text-muted-foreground/60`
- `color-fun-500` → `background` 或 `card`

## 组件使用建议

### 优先使用 shadcn 组件
```tsx
// ❌ 不要
<div className="rounded-lg bg-[#171717] px-4 py-2 hover:bg-[#202020]">

// ✅ 应该
import { Card, CardContent } from "@/components/ui/card"
<Card><CardContent>...</CardContent></Card>

// ❌ 不要
<button className="bg-white text-black rounded-lg px-4 py-2">

// ✅ 应该
import { Button } from "@/components/ui/button"
<Button>...</Button>
```

### 分级文字颜色
```tsx
// 主标题
<h1 className="text-foreground text-2xl font-bold">

// 副标题
<h2 className="text-foreground/90 text-lg font-semibold">

// 正文
<p className="text-foreground/80">

// 次要信息
<span className="text-muted-foreground text-sm">

// 禁用/占位符
<input placeholder="..." className="placeholder:text-muted-foreground" />
```

## 下一步行动

### 建议顺序
1. Reports 页面重构（工作量最大，建议分批处理）
2. AI Chat 组件
3. Work 子组件批量处理
4. 最后清理零散的 motion 组件

### 验证步骤
每个文件重构后：
```bash
# 检查语法
pnpm run lint

# 运行应用测试暗色/亮色主题切换
pnpm run dev

# 确保无硬编码残留
grep -r "#[0-9a-fA-F]\{6\}" src/ --include="*.tsx"
```

## 注意事项
- ⚠️ 图表组件（recharts）的颜色可能需要通过 CSS 变量动态注入
- ⚠️ 部分 rgba 透明度需要用 Tailwind 的 `/[0.x]` 语法
- ⚠️ SVG 内联样式（stroke/fill）需要特殊处理
