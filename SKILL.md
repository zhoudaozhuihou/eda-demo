---
name: html-prd-marker
description: Parses a Markdown PRD and annotates requirements onto an HTML prototype with interactive tooltip/popover markers. Use when the user wants to map PRD requirements to an HTML prototype, annotate an HTML mockup with product specs, or visualize which parts of a UI correspond to which requirements.
---

# HTML PRD Marker

将 Markdown 格式的 PRD 需求文档中的需求条目，以交互式弹出标注（tooltip/popover）的形式标注到 HTML 原型页面上，生成一份新的带标注 HTML 文件。

## 工作流程

### Step 1: 收集输入

向用户确认两个文件：

1. **PRD 文件**：Markdown 格式的需求文档路径
2. **HTML 原型文件**：需要标注的 HTML 原型文件路径

如果用户未提供文件路径，用 AskUserQuestion 工具询问。

### Step 2: 解析 PRD 需求

读取 Markdown PRD 文件，提取结构化需求条目。解析规则：

- 每个二级标题（`##`）或三级标题（`###`）视为一个需求模块
- 标题下方的正文段落、列表条目为该需求的具体描述
- 为每条需求生成唯一编号，格式：`REQ-001`, `REQ-002`, ...
- 提取每条需求的：标题、描述摘要、优先级（如有标注）

输出一个需求列表供后续映射使用。

### Step 3: 分析 HTML 原型

读取 HTML 原型文件，分析页面结构：

- 识别主要 UI 区域（header, nav, sidebar, main content, footer 等）
- 识别交互元素（button, input, form, link, table 等）
- 识别带有 `id` 或有意义 `class` 的元素作为标注锚点

### Step 4: 需求-元素映射

根据需求描述与 HTML 元素的语义对应关系，建立映射：

- 按需求描述中的关键词匹配页面元素（如"登录按钮" → `<button>登录</button>`）
- 按页面区域匹配功能模块（如"导航栏需求" → `<nav>` 区域）
- 无法自动匹配的需求，标注在最相关的父级容器上

**重要**：将映射结果展示给用户确认后再继续。用简洁的表格格式呈现：

```
需求编号 | 需求标题     | 标注目标元素
REQ-001 | 用户登录     | button#login-btn
REQ-002 | 搜索功能     | div.search-bar
```

### Step 5: 生成带标注的 HTML

基于映射关系，生成新的 HTML 文件。注入标注系统的方式：

1. 在 `</head>` 前注入标注所需的 CSS 样式（参考下方样式模板）
2. 在目标元素上添加标注属性和标记徽章
3. 在 `</body>` 前注入标注交互的 JS 脚本（参考下方脚本模板）

#### 标注徽章

在每个被标注元素上添加一个编号徽章：

```html
<span class="prd-marker" data-req-id="REQ-001" data-req-title="用户登录" data-req-desc="用户可通过邮箱和密码登录系统，支持记住密码功能">1</span>
```

#### 标注交互行为

- **悬停**徽章：显示需求标题的 tooltip
- **点击**徽章：显示完整需求详情的 popover 弹窗，包含编号、标题、详细描述
- **点击弹窗外部**或按 **Esc**：关闭弹窗
- 页面右上角添加一个**切换按钮**，可以显示/隐藏所有标注徽章

### Step 6: 输出文件

- 文件名格式：`原始文件名_annotated.html`
- 保存到用户工作目录或指定位置
- 使用 `present` 工具交付文件

## CSS 样式模板

将以下样式注入到生成文件的 `<head>` 中：

```css
<style>
  /* PRD 标注系统样式 */
  .prd-marker-target { position: relative; outline: 2px dashed #4F46E5 !important; outline-offset: 2px; }
  .prd-marker {
    display: inline-flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 50%;
    background: #4F46E5; color: #fff; font-size: 11px; font-weight: 700;
    cursor: pointer; position: absolute; top: -10px; right: -10px; z-index: 9999;
    box-shadow: 0 2px 6px rgba(79,70,229,.4);
    transition: transform .15s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .prd-marker:hover { transform: scale(1.2); }

  .prd-tooltip {
    display: none; position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
    background: #1E1B4B; color: #fff; padding: 6px 12px; border-radius: 6px;
    font-size: 12px; white-space: nowrap; z-index: 10000; pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .prd-tooltip::after {
    content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
    border: 5px solid transparent; border-top-color: #1E1B4B;
  }
  .prd-marker:hover .prd-tooltip { display: block; }

  .prd-popover {
    display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: #fff; border-radius: 12px; padding: 24px; z-index: 10001;
    box-shadow: 0 20px 60px rgba(0,0,0,.15); max-width: 480px; width: 90%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .prd-popover.active { display: block; }
  .prd-popover-overlay {
    display: none; position: fixed; inset: 0; background: rgba(0,0,0,.3); z-index: 10000;
  }
  .prd-popover-overlay.active { display: block; }
  .prd-popover-id { font-size: 12px; color: #6366F1; font-weight: 600; margin-bottom: 4px; }
  .prd-popover-title { font-size: 18px; font-weight: 700; color: #1E1B4B; margin-bottom: 12px; }
  .prd-popover-desc { font-size: 14px; line-height: 1.6; color: #475569; }
  .prd-popover-close {
    position: absolute; top: 12px; right: 16px; background: none; border: none;
    font-size: 20px; cursor: pointer; color: #94A3B8; line-height: 1;
  }
  .prd-popover-close:hover { color: #1E1B4B; }

  .prd-toggle-btn {
    position: fixed; top: 16px; right: 16px; z-index: 10002;
    background: #4F46E5; color: #fff; border: none; border-radius: 8px;
    padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer;
    box-shadow: 0 2px 8px rgba(79,70,229,.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .prd-toggle-btn:hover { background: #4338CA; }
  .prd-unmapped-section {
    margin-top: 40px; padding: 24px; border: 1px dashed #E2E8F0; border-radius: 8px;
    background: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .prd-unmapped-section h3 { font-size: 16px; font-weight: 700; color: #475569; margin-bottom: 12px; }
  .prd-unmapped-section ul { padding-left: 20px; }
  .prd-unmapped-section li { font-size: 14px; line-height: 1.8; color: #64748B; }
  .prd-markers-hidden .prd-marker { display: none !important; }
  .prd-markers-hidden .prd-marker-target { outline: none !important; }
</style>
```

## JS 脚本模板

将以下脚本注入到 `</body>` 前：

```html
<script>
(function() {
  // Popover 逻辑
  const overlay = document.createElement('div');
  overlay.className = 'prd-popover-overlay';
  const popover = document.createElement('div');
  popover.className = 'prd-popover';
  document.body.appendChild(overlay);
  document.body.appendChild(popover);

  document.querySelectorAll('.prd-marker').forEach(function(marker) {
    marker.addEventListener('click', function(e) {
      e.stopPropagation();
      var id = this.getAttribute('data-req-id');
      var title = this.getAttribute('data-req-title');
      var desc = this.getAttribute('data-req-desc');
      popover.innerHTML = '';
      var closeBtn = document.createElement('button');
      closeBtn.className = 'prd-popover-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', closePopover);
      var idDiv = document.createElement('div');
      idDiv.className = 'prd-popover-id';
      idDiv.textContent = id;
      var titleDiv = document.createElement('div');
      titleDiv.className = 'prd-popover-title';
      titleDiv.textContent = title;
      var descDiv = document.createElement('div');
      descDiv.className = 'prd-popover-desc';
      descDiv.textContent = desc;
      popover.appendChild(closeBtn);
      popover.appendChild(idDiv);
      popover.appendChild(titleDiv);
      popover.appendChild(descDiv);
      popover.classList.add('active');
      overlay.classList.add('active');
    });
  });

  overlay.addEventListener('click', closePopover);
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closePopover(); });

  function closePopover() {
    popover.classList.remove('active');
    overlay.classList.remove('active');
  }

  // 切换按钮
  var toggleBtn = document.createElement('button');
  toggleBtn.className = 'prd-toggle-btn';
  toggleBtn.textContent = '隐藏标注';
  var visible = true;
  toggleBtn.addEventListener('click', function() {
    visible = !visible;
    document.body.classList.toggle('prd-markers-hidden', !visible);
    toggleBtn.textContent = visible ? '隐藏标注' : '显示标注';
  });
  document.body.appendChild(toggleBtn);
})();
</script>
```

## 注意事项

- 不修改原始 HTML 文件，始终生成新文件
- 保持原型页面的原有样式和功能不受影响，标注样式使用 `prd-` 前缀避免冲突
- 被标注元素需添加 `position: relative`（通过 `.prd-marker-target` 类实现）
- 如果 PRD 中存在无法映射的需求，在文件底部生成一个"未映射需求"汇总区域
- data 属性中的特殊字符需做 HTML 实体转义
- 如果检测到项目使用 React/Vue，优先使用 Data Attributes 或代码注释进行标注，严禁直接操作静态 HTML 标签。

## 参考示例

具体的输入输出示例请参考 [examples.md](examples.md)。
