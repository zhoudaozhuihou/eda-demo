# 交互设计与视觉规范文档

| 版本 | 日期 | 修改人 | 说明 |
| :--- | :--- | :--- | :--- |
| v1.0 | 2026-01-01 | Design Team | 初始版本 |

## 1. 概述
本规范旨在统一 Data API Platform 的用户体验与视觉风格，基于 Shadcn UI 设计系统进行扩展。

## 2. 交互设计规范 (Interaction Design)

### 2.1 导航与布局
*   **侧边导航**: 宽度 `240px`，支持折叠。选中态使用 `bg-primary/10` + `text-primary`。
*   **面包屑**: 层级深度超过 3 层时必须显示面包屑。
*   **加载状态**: 
    *   页面级加载：使用顶部进度条 (NProgress)。
    *   区块加载：使用 Skeleton 骨架屏。
    *   按钮加载：显示 Spinner 并禁用点击。

### 2.2 反馈机制
*   **成功反馈**: Toast 提示，显示时间 3s。
*   **错误反馈**: 
    *   表单校验：行内红字提示。
    *   系统异常：Toast 红色提示或 Error Boundary 页面。
    *   危险操作：弹出 Dialog 二次确认（需输入名称确认）。

## 3. 视觉设计规范 (Visual Design)

### 3.1 色彩系统 (Color Palette)
*   **Primary (品牌色)**: `hsl(221.2 83.2% 53.3%)` (Blue-600) - 用于主按钮、激活状态。
*   **Secondary**: `hsl(210 40% 96.1%)` - 用于次级按钮、背景底色。
*   **Destructive**: `hsl(0 84.2% 60.2%)` (Red-500) - 用于删除、错误。
*   **Text**:
    *   Primary: `hsl(222.2 47.4% 11.2%)` (Gray-900)
    *   Muted: `hsl(215.4 16.3% 46.9%)` (Gray-500)

### 3.2 字体 (Typography)
*   **Font Family**: `Inter`, `system-ui`, `sans-serif`. 代码字体使用 `JetBrains Mono`.
*   **Scale**:
    *   H1: `30px/36px` Bold
    *   H2: `24px/32px` Semibold
    *   H3: `20px/28px` Semibold
    *   Body: `14px/20px` Regular
    *   Small: `12px/16px` Medium

### 3.3 间距 (Spacing)
基于 `4px` 网格系统：
*   `xs`: 4px
*   `sm`: 8px
*   `md`: 16px
*   `lg`: 24px
*   `xl`: 32px

### 3.4 组件样式
*   **Card**: 圆角 `xl` (12px)，边框 `border-border`，悬停 `hover:shadow-md`。
*   **Button**: 圆角 `md` (6px)，高度 `h-9` (36px)。
