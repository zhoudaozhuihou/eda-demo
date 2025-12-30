# Material UI 替换视觉对照（基线）

## 目标

在将当前 UI 组件实现替换为 Material UI（MUI）的前提下，严格保持现有页面的视觉设计与交互行为一致。

## 现状（基线实现）

- 样式与布局：Tailwind CSS（`src/styles/tailwind.css`）+ 设计令牌（CSS Variables，`src/styles/theme.css`）
- 组件层：`src/app/components/ui/*`（以 Radix + Tailwind 组合封装为主）
- 页面：`src/app/components/*`（通过 `./ui/*` 引用组件）

## 设计令牌对照（CSS Variables → MUI Theme）

| 令牌（`theme.css`） | 含义 | MUI 对应建议 |
| --- | --- | --- |
| `--background` | 页面背景 | `palette.background.default` |
| `--foreground` | 主文字色 | `palette.text.primary` |
| `--card` | 卡片背景 | `palette.background.paper` |
| `--card-foreground` | 卡片文字色 | `palette.text.primary`（保持一致） |
| `--popover` | 浮层背景 | `palette.background.paper`（并在 Popover/Menu 单独覆盖） |
| `--popover-foreground` | 浮层文字色 | `palette.text.primary` |
| `--primary` | 主色 | `palette.primary.main` |
| `--primary-foreground` | 主色反白 | `palette.primary.contrastText` |
| `--secondary` | 次级背景/按钮 | `palette.secondary.main` |
| `--secondary-foreground` | 次级文字 | `palette.secondary.contrastText` |
| `--muted` | 静态弱背景 | `palette.action.disabledBackground`/自定义 |
| `--muted-foreground` | 弱文字 | `palette.text.secondary` |
| `--accent` | hover/强调背景 | `palette.action.hover` |
| `--accent-foreground` | 强调文字色 | `palette.text.primary` |
| `--destructive` | 危险色 | `palette.error.main` |
| `--destructive-foreground` | 危险反白 | `palette.error.contrastText` |
| `--border` | 边框色 | `palette.divider` |
| `--input-background` | 输入背景 | `components.MuiInputBase`/`MuiOutlinedInput` 覆盖 |
| `--switch-background` | Switch 未选中轨道 | `components.MuiSwitch` 覆盖 |
| `--radius` | 圆角 | `shape.borderRadius`（约等于 10px） |

## 组件一对一映射（`./ui/*` → MUI）

| 现有组件 | 主要职责 | MUI 基础组件 |
| --- | --- | --- |
| `ui/button.tsx` | 变体按钮、尺寸、图标布局、禁用/焦点态 | `@mui/material/Button` 或 `ButtonBase` |
| `ui/card.tsx` | 卡片容器（边框、圆角、背景） | `@mui/material/Paper` |
| `ui/input.tsx` | 单行输入（边框/背景/焦点环） | `@mui/material/InputBase`/`OutlinedInput` |
| `ui/textarea.tsx` | 多行输入 | `@mui/material/InputBase`（`multiline`） |
| `ui/label.tsx` | 表单标签 | `@mui/material/FormLabel` |
| `ui/badge.tsx` | 小型标记（default/secondary/outline/destructive） | `@mui/material/Chip` 或 `Box` + theme |
| `ui/tabs.tsx` | Tabs 容器、列表、触发项与内容区 | `@mui/material/Tabs` + `Tab` |
| `ui/select.tsx` | 选择器 Trigger/Content/Item 组合 | `@mui/material/Menu`/`Popover` + `MenuItem` |
| `ui/dialog.tsx` | 模态框容器与触发器/标题/页脚 | `@mui/material/Dialog` + 子组件 |
| `ui/dropdown-menu.tsx` | 下拉菜单（Header 用） | `@mui/material/Menu` + `MenuItem` |
| `ui/avatar.tsx` | 头像图片与 fallback | `@mui/material/Avatar` |
| `ui/checkbox.tsx` | 复选框 | `@mui/material/Checkbox` |
| `ui/switch.tsx` | 开关 | `@mui/material/Switch` |
| `ui/scroll-area.tsx` | 可滚动区域 + 自定义滚动条 | `Box` + `overflow` + scrollbar 样式覆盖 |

## 页面验证清单（保持行为与边缘态一致）

- `src/app/App.tsx`：整体布局、侧边栏收起/展开动画、容器间距
- `src/app/components/Header.tsx`：团队/账号/语言/用户菜单交互、菜单对齐与宽度
- `src/app/components/Dashboard.tsx`：统计卡片、hover 阴影
- `src/app/components/Datasets.tsx`：列表/详情切换、空状态
- `src/app/components/APIBuilder.tsx`：多步骤表单、校验提示、禁用态
- `src/app/components/APICatalog.tsx`：筛选、复制按钮、Dialog 打开/滚动
- `src/app/components/Approval.tsx`：Dialog、状态徽标、操作按钮
- `src/app/components/Management.tsx`：Tabs、大量表单/列表、按钮变体
- `src/app/components/Settings.tsx`：Tabs、Select、Switch、表单布局

## 像素级验证策略

- 以路由/视图为单位进行截图基线：Dashboard / Datasets(list, detail) / API Catalog / Settings / Management 等。
- 对关键弹层状态额外截图：Header 下拉菜单、Dialog 打开态、Select 展开态。
- 同一 viewport 下对比（桌面与小屏各一套）。
