# Contributing

## 开发约定

- 保持改动尽量小且可回滚
- 避免提交任何密钥/Token/本地环境文件（已在 `.gitignore` 中忽略 `.env*`）

## 提交信息规范

仓库提供提交信息模板 `.gitmessage`，建议启用：

`git config commit.template .gitmessage`

提交格式建议采用 Conventional Commits：

`<type>(<scope>): <subject>`

常见 `type`：

- `feat`：新增功能
- `fix`：问题修复
- `refactor`：重构（不改变外部行为）
- `perf`：性能优化
- `test`：测试相关
- `build`：构建/依赖相关
- `ci`：CI 配置相关
- `chore`：杂项维护

## 提交前检查

- 运行：`npm run test:run`
- 运行：`npm run build`
