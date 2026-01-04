# 文档管理规范 (Documentation Standards)

## 1. 文档目录结构

项目文档采用生命周期分类法进行管理，所有文档均存放于 `docs/` 目录下：

- **01_Requirements/**: 需求阶段文档（PRD, 竞品分析, 用户调研）
- **02_Design/**: 设计阶段文档（UI/UX, 原型, 技术可行性, 迁移指南）
- **03_Development/**: 开发阶段文档（架构设计, API文档, 数据库设计, 编码规范）
- **04_Release/**: 发布阶段文档（发布说明, 部署指南）
- **05_Operation/**: 运营阶段文档（监控, 埋点, 维护手册）

## 2. 命名规范

- **文件名**: 使用英文 PascalCase 或 snake_case，尽量保持一致。
- **标题**: 文档首行必须包含一级标题 (`# Title`)。
- **语言**: 推荐使用中文编写，文件名推荐使用英文以便于引用。

## 3. 维护流程

1.  **新建文档**: 根据文档类型放入对应子目录。
2.  **更新文档**: 每次重大变更需在文档头部更新版本记录（如果有）。
3.  **废弃文档**: 不建议直接删除，可移动到 `docs/archive/`（需新建）或在文件名加 `_deprecated` 后缀。

## 4. 关键文档索引

- **产品需求**: `docs/01_Requirements/PRD.md`
- **UI/UX 规范**: `docs/02_Design/UI_UX_Guidelines.md`
- **MUI 迁移指南**: `docs/02_Design/MUI_Migration_Guide.md`
- **AI 交互指南**: `docs/03_Development/AI_Interaction_Guidelines.md`
