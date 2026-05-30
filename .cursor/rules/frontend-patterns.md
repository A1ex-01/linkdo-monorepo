---
description: "前端开发规范 - API 调用、状态管理、组件规范"
alwaysApply: true
---

# 前端开发规范

## 一、API 调用规范

### 1.1 必须使用 Services 层封装 API

**必须这样做**：

- API 函数放在 `services/` 目录下的对应文件中
- 每个 API 函数独立命名导出

```typescript
// services/base.ts
import { request } from "./request";

export const getPostList = (params: { page: number }) => {
  return request.get<IListRes<IPost>>("/mobi/u1/web/post/goodList", params);
};

export const getAuthorInfo = (params: { uuid: string }) => {
  return request.get<IRes<IAuthor>>("/mobi/u1/web/author/info", params);
};

export const updatePost = (data: IUpdatePostParams) => {
  return request.post<IRes<null>>("/mobi/u1/web/post/update", data);
};
```

### 1.2 获取列表请求使用 useRequest hook

**禁止这样做**：

```typescript
// 禁止 ❌
useEffect(() => {
  getMyCollectionsList({ post_uuid: params.uuid }).then((res) => {
    setList(res.data?.list ?? []);
  });
}, [params.uuid]);
```

**这样做（ahooks useRequest）**：

```typescript
// 正确 ✅
const { runAsync, data, loading, refreshAsync } = useRequest(
  async (params) => {
    const res = await getMyCollectionsList({ post_uuid: params.uuid });
    return res.data?.list ?? [];
  },
  {
    manual: true,
    refreshDeps: [collectPostDialogInfo?.data?.uuid],
  },
);
```

### 1.3 useRequest 手动模式原则

- 数据获取使用 `manual: true` 模式，通过 `run` / `runAsync` 手动触发
- 使用 `refreshDeps` 控制何时自动刷新
- 除非是页面初始加载，否则不要用 `manual: false`

---

## 二、状态管理规范

### 2.1 必须使用 Zustand 管理全局状态

```typescript
// store/common.ts
import { create } from "zustand";

interface ICommonStore {
  paymentDialogIsOpen: boolean;
  setPaymentDialogIsOpen: (isOpen: boolean) => void;
  collectPostDialogInfo?: ICollectPostDialogInfo;
  setCollectPostDialogInfo: (info: ICollectPostDialogInfo | undefined) => void;
}

export const useCommonStore = create<ICommonStore>()((set) => ({
  paymentDialogIsOpen: false,
  setPaymentDialogIsOpen: (isOpen) => set({ paymentDialogIsOpen: isOpen }),
  collectPostDialogInfo: undefined,
  setCollectPostDialogInfo: (info) => set({ collectPostDialogInfo: info }),
}));
```

---

## 三、组件规范

### 3.1 Props 类型必须使用 Interface

```typescript
// 禁止 ❌
const PostCard = ({ item, className }: { item: any; className?: string }) => {};

// 正确 ✅
interface IPostCardProps {
  item: IPost;
  className?: string;
  showSummaryButton?: boolean;
}

export default function PostCard({
  item,
  className,
  showSummaryButton,
}: IPostCardProps) {}
```

### 3.2 组件文件命名

- 文件名：`kebab-case`（如 `payment-dialog.tsx`、`collect-button.tsx`）
- 组件名：PascalCase（如 `PaymentDialog`、`CollectButton`）

---

## 四、类型定义规范

### 4.1 类型文件组织

```
/types
  base.ts    - 业务实体类型（IUser, IPost, ICollection 等）
  common.ts  - 通用类型（IRes, IList, IPaging, IOption 等）
```

### 4.2 必须使用的类型模式

```typescript
// types/common.ts
export interface IRes<T> {
  data: T;
  success: boolean;
  message: string;
  code: number | string;
}

export type IListRes<T> = IRes<IList<T>>;

export interface IList<T> {
  list: T[];
  hasMore: boolean;
  totalNum?: number;
  nextId?: string;
  pageSize: number;
  nextStart?: number;
}

export interface IPaging {
  current: number;
  pageSize: number;
  nextId?: string;
}
```

### 4.3 业务类型命名

- 所有业务实体接口使用 `I` 前缀
- 使用 `PascalCase`

```typescript
// types/base.ts

export interface IAuthor {
  uuid: string;
  name: string;
  avatar?: string;
  author_summary?: string;
}

export interface ICollection {
  uuid: string;
  name: string;
  cnt_collect?: number;
}
```

---

## 五、样式规范

### 5.1 使用 cn() 合并类名

```typescript
import { cn } from "@/lib/utils";

<div className={cn("base-classes", condition && "conditional-classes", className)}>
```

---

## 六、错误处理规范

### 6.1 组件内错误处理

```typescript
const handleSave = async () => {
  try {
    const res = await updatePost({ uuid, collections });
    if (res.success) {
      toast.success("保存成功");
      setCollectPostDialogInfo(undefined);
    }
  } catch (error) {
    toast.error("保存失败");
  }
};
```

---

## 七、加载状态规范

### 7.1 使用 useRequest 自带的 loading

```typescript
const { loading, runAsync } = useRequest(asyncFn, { manual: true });

{loading ? (
  <div className="flex h-[60vh] items-center justify-center">
    <IconLoader2 className="size-4 animate-spin" />
  </div>
) : (
  <div>内容</div>
)}
```

---

## 八、分页规范

### 8.1 分页参数接口

```typescript
import type { IPaging } from "@/types/common";

// 传入参数包含分页信息
const getPostList = (params: { category: string } & IPaging) => {
  return request.get<IListRes<IPost>>("/mobi/u1/web/post/list", params);
};
```

---

## 九、图片规范

### 9.1 必须使用 AImage 组件

**禁止**使用原生 `<img>` 标签。

```tsx
import AImage from "@/components/a-image";

<AImage
  src={author.avatar}
  alt={author.name}
  className="size-12 rounded-full"
/>;
```

---
