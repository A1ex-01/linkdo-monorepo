> 没错它是一款 todolist + 番茄时钟 + 多端集成同步工具，让你不再在任务工具之间来回切换。**前端开发转 AI 全栈中的卑微崽** 详细介绍看项目地址：https://github.com/A1ex-01/linkdo-monorepo 官网：https://linkdo.a1ex.online/ 欢迎学习交流

## 为什么做 Linkdo - 不想再在任务之间来回切换

起点很简单，日报，bug 反馈，需求整理，日程管理。这几个内容是一天下来最高频访问的内容。但是它总是会坐落于 N 个不同的软件或文档中，要自己管理任务进度，时间，deadline，等等等等。这是我过往的在推进任务上的痛点。所以我做了这款应用。能将 Notion Clickup 等第三方应用内容同步到 Linkdo 中，并且能从开始到结束，跟踪知道已完成，中间的所有状态流转，文档内容更新、时间更改，都能实时的同步到对应的集成，如果你想，飞书/jira 等等应用，都可以集成到 Linkdo。

也许这个项目并没有给我带来什么，但是至少我不用再每月多付 6.99 美刀 hahaha

## 灵感
我用过很多任务管理类工具，比如 番茄时钟/滴答清单/浮墨笔记，等等应用，都发现会有一些满足不到我的地方，我需要的是，任务管理，番茄时钟、Pin悬浮窗，但是上面的应用都不做 Pin悬浮窗，我并不知道为什么。比如我只是想 Pin住这个任务。

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/ad854434d903497f8664d85627098771~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgYTFleA==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiNDI5NzMzMDEyNzI4MTA4NiJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1790604980&x-orig-sign=TD2oyi7SpXzAcEcdo5HH21vwZaw%3D)

不过好在最后找到了一款应用 Blitzit。它是一款专注于任务管理和时间追踪的极简效率应用，他有我想要的功能，能连接 notion/clickup 等第三方，有悬浮窗，并且有好的设计感界面。抛开每个月 6.99 刀的订阅费，它还是有一个痛点未能让我能 all in 它。
我发现自己的问题并没有消失：
-   可以把 Notion、ClickUp 的任务拉进来；
-   可以修改已经导入的任务；
-   但不能把它当作唯一入口：在应用中新建任务后，无法可靠地同时写入 Notion、ClickUp 或飞书。
这带来的结果是：任务看似集中，操作却没有集中。建一条任务、改一个状态、补一段笔记，还是要回到原来的平台。注意力被工具本身切碎了。

所以我想做一个更直接的东西：外部平台仍是用户已有的工作系统，而 Linkdo 负责把每天真正要做的事收进一个桌面工作台。

## Linkdo 的目标结果

连接外部应用后，Linkdo 希望成为日常执行任务时的唯一操作入口：

1.  在 Linkdo 创建任务，同时在关联的 Notion 数据库或 ClickUp List 创建对应任务；
1.  在 Linkdo 更新状态、笔记和排期，把变化写回来源平台；
1.  把外部已有任务导入到同一个看板，专注时不必反复打开多个网页；
1.  在一个任务视图里完成“计划、执行、记录、回顾”这件事。

它不是要取代 Notion 或 ClickUp。相反，它希望保留它们各自擅长的能力：Notion 适合知识与页面，ClickUp 适合项目协作；Linkdo 更关注“我现在该做什么、正在做什么、今天做完了什么”。

## 现在已经能做什么

下面列的是当前已经实现的能力，不把路线图当成功能卖。

### 1. 用 Collection 管理不同工作上下文

我把项目、日常事务和专注任务放进不同的 Collection。每个 Collection 都是一块独立看板，任务按四个阶段流转：

```
Backlog → This Week → Today → Done
```

你可以在看板中创建任务、拖拽换列、调整顺序，设置预计时长和计划日期。集合顶部会显示未完成任务数与预计总时长，切换集合后可以很快进入另一段工作上下文。

![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/f385fa7f719e40c784c058516e852fce~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgYTFleA==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiNDI5NzMzMDEyNzI4MTA4NiJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1790605931&x-orig-sign=3pGcrVtI6zNIMt%2BkXHyCDf25P4Y%3D)

### 2. 从看板切到专注模式

任务管理对我来说不应该只停留在“列清单”。Linkdo 有三种可切换窗口形态：

| 形态   | 适合什么时候           |
| ---- | ---------------- |
| 标准看板 | 规划任务、拖拽排序、批量查看进度 |
| 侧边栏  | 边工作边盯住当前任务和计时器   |
| 胶囊窗口 | 想把计时器缩到最小、保持置顶时  |

计时支持两种方式：基于预计时长的倒计时，以及不预设时长的正计时。每次开始、暂停与结束都会形成专注会话，并累计到任务的实际用时；超出预计时间也会明确显示。


![image.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/83b6c8daddda4666b7634aa36c8c995b~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgYTFleA==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiNDI5NzMzMDEyNzI4MTA4NiJ9&rk3s=e9ecf3d6&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1790606945&x-orig-sign=pOovEOH66Tl3pR4E0J%2FKRbN7p6E%3D)




### 3. 任务笔记与 Notion 回写

任务本身可以写 Markdown 笔记，不必为了补一段上下文另开文档。

对于关联 Notion 的任务，笔记会写回对应页面正文。这样我可以在 Linkdo 中完成当天的执行记录，需要完整上下文时，再回到 Notion 页面继续展开。

### 4. 能力

-   一个 Collection 可以绑定 Notion Database 或 ClickUp List；
-   可以把外部状态映射为 Linkdo 的四列；
-   在 Linkdo 新建任务时，会向所选的 Notion 数据库或 ClickUp List 创建对应记录；
-   任务状态变化会写回 Notion 与 ClickUp；
-   标题、计划日期和笔记正文目前会写回 Notion；
-   可以选择尚未导入的外部任务，导入当前集合并按状态映射落列；
-   任务卡片可以一键跳回原始 Notion 页面或 ClickUp 任务。、

### 5. 不只记录完成数，也记录专注投入

报表支持按集合和时间范围查看，可选近 7 天、30 天、90 天或自定义区间。

-   总览：工作天数、完成任务数、预计时长、实际专注时长；
-   按天时间线：开始数、完成数、专注分钟；
-   按集合拆分：待办、进行中、完成数量，以及预计与实际用时；
-   专注会话列表：每次计时的起止时间和所属任务。

我更在意“时间去了哪里”，而不是只看今天勾掉了多少条任务。

### 6. 可以直接用自然语言操作任务(Beta)

桌面端内置了一个 AI 对话入口。现在可以通过对话创建、查询、修改和删除任务，也能操作 Collection 与关联的 Notion / ClickUp 数据库。

## 开发中

 1. Agent 端
 2. Linkdo MCP
 3. 集成飞书
 4. 集成 Figma comment 

> windows 端还有大大小小的UI适配问题没时间测，奈何用虚拟机太麻烦了懒得测😭，有同学感兴趣这个项目可以联系

## 最后 
我想解决的问题一直很明确：
> 不管任务最初来自哪里，真正开始做事时，我只想面对一个干净、可靠、能让我专注下去的界面。



如果你也有 Notion、ClickUp、飞书多头管理的困扰，或者对任务同步、专注工作流有自己的使用习惯，欢迎交流。真实场景比功能清单更能决定 Linkdo 接下来应该做什么。

项目地址：https://github.com/A1ex-01/linkdo-monorepo 欢迎学习交流

