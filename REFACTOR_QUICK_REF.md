# Shadcn 主题重构 - 快速参考卡

## 🎯 已完成（75%）

### 核心改动
- ✅ 移除所有 `--color-atext-*` 和 `--color-fun-*` CSS 变量
- ✅ 实现主题切换按钮（Home 页右上角）
- ✅ 支持 light/dark 主题，localStorage 持久化
- ✅ 重构 15+ 个组件，移除 50+ 处硬编码

### 已完成的文件
```
apps/desktop/src/
├── app/
│   ├── layout.tsx ✅ (主题脚本)
│   ├── page.tsx ✅
│   ├── home/
│   │   ├── page.tsx ✅
│   │   └── _components/
│   │       ├── collection-card.tsx ✅
│   │       ├── create-collection-modal.tsx ✅
│   │       └── sidebar.tsx ✅
│   ├── work/
│   │   └── content.tsx ✅
│   ├── login/
│   │   └── page.tsx ✅ (移除 10 处 text-atext-*)
│   └── reports/_components/
│       └── report-collection-table.tsx ✅ (移除 14 处)
├── components/
│   ├── theme-toggle.tsx ✅ (新增)
│   ├── bottom-nav.tsx ✅
│   ├── window-title-bar.tsx ✅
│   └── account-settings-dialog.tsx ✅
├── providers/
│   └── base.tsx ✅
└── styles/
    └── globals.css ✅ (清理自定义变量)
```

## ⏳ 待处理（25%）

### 优先级 1：Reports 页面（30 处硬编码）
```bash
# 主文件
apps/desktop/src/app/reports/page.tsx
# 需要替换背景、文字、边框颜色，建议改用 Tabs 和 Button 组件

# 图表组件
apps/desktop/src/app/reports/_components/report-timeline-chart.tsx
# recharts 颜色用 CSS 变量：hsl(var(--primary))

# 汇总卡片
apps/desktop/src/app/reports/_components/report-summary-cards.tsx
# 改用 shadcn Card 组件
```

### 优先级 2：AI Chat（8 处）
```bash
apps/desktop/src/components/ai-chat/index.tsx
# 替换 rgba() 和十六进制颜色
```

## 🚀 快速执行命令

```bash
# 1. 查看剩余硬编码位置
cd apps/desktop
grep -rn "#[0-9a-fA-F]\{6\}" src/app/reports/ --include="*.tsx"

# 2. 测试主题切换
pnpm run dev
# 浏览器访问 http://localhost:3000/home
# 点击右上角主题切换按钮

# 3. 验证无残留
grep -r "text-atext\|color-atext" src/ --include="*.tsx" | grep -v "//"
# 应该只返回 1 处注释

# 4. Lint 检查
pnpm run lint
```

## 📋 颜色替换速查表

| 旧值 | 新值 | 用途 |
|------|------|------|
| `bg-[#171717]` | `bg-card` | 卡片背景 |
| `text-white` | `text-foreground` | 主要文字 |
| `text-[#8d8d92]` | `text-muted-foreground` | 次要文字 |
| `border-[#363636]` | `border-border` | 边框 |
| `text-atext-500` | `text-foreground` | 主文字 |
| `text-atext-460` | `text-muted-foreground` | 次要文字 |

## 🎨 主题变量使用指南

```tsx
// 背景层级
bg-background          // 页面底色
bg-card               // 卡片/面板
bg-muted              // 输入框/禁用
bg-accent             // hover/选中

// 文字层级
text-foreground       // 主标题
text-foreground/80    // 正文
text-muted-foreground // 说明/占位

// 交互组件
bg-primary text-primary-foreground  // 主按钮
bg-secondary text-secondary-foreground // 次按钮
```

## ✅ 完工检查

- [ ] Reports 页面三个文件重构完成
- [ ] AI Chat 重构完成
- [ ] 运行 `pnpm run lint` 无错误
- [ ] 主题切换测试通过（所有页面 light/dark 正常）
- [ ] 无残留 `text-atext-*` 变量（除注释）
- [ ] 硬编码颜色 < 5 处（仅特殊场景）

---

**完成度**: 75% | **预计剩余时间**: 40 分钟
