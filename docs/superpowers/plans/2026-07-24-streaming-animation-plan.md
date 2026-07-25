# TokUI 流式渲染出现动画实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为流式渲染中新挂载的 DOM 节点添加淡入上滑动画，SSE 输出时各元素依次优雅出现。

**Architecture:** 在 CSS 中定义 `tokui-fade-slide-in` 关键帧和 `.tokui-animate-in` 类，在 `Renderer.mountStreaming()` 中元素 append 后统一添加该类，静态渲染 `Renderer.mount()` 不添加。

**Tech Stack:** 原生 CSS `@keyframes` + `classList.add`，无第三方库。

---

## 文件结构

| 文件 | 作用 |
|------|------|
| `src/style/tokui.css` | 定义动画关键帧和 `.tokui-animate-in` 类 |
| `src/core/renderer.js` | 在 `mountStreaming()` 中给新元素添加动画类 |
| `tests/parser.test.js` | 解析器测试（本次不改，仅作为回归验证） |

---

### Task 1: 添加 CSS 动画

**Files:**
- Modify: `src/style/tokui.css`

**背景:**
`tokui.css` 已包含所有组件样式和 CSS 变量。需要在末尾新增一个动画区域，避免混入现有组件样式。

- [ ] **Step 1: 在 `tokui.css` 末尾追加动画关键帧和类**

```css
/* =====================
   流式渲染动画
   ===================== */

@keyframes tokui-fade-slide-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tokui-animate-in {
  animation: tokui-fade-slide-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@media (prefers-reduced-motion: reduce) {
  .tokui-animate-in {
    animation: none;
  }
}
```

- [ ] **Step 2: 验证 CSS 文件语法**

Run: `npm run build`
Expected: 构建成功，无 CSS 语法错误。

---

### Task 2: 在流式挂载时添加动画类

**Files:**
- Modify: `src/core/renderer.js`

**背景:**
`Renderer.mountStreaming()` 负责把流式渲染中解析出的每个节点 append 到当前 slot。元素刚进入 DOM 时是「硬切」状态，需要在这一步统一加上 `.tokui-animate-in`。

当前 `mountStreaming` 代码位置：

```js
mountStreaming(node, container){
    const dom = this.render(node)

    // 优先使用组件内部暴露的 slot 区域
    let slot = dom.querySelector('.my-slot')

    if (!slot) {
        slot = dom
    }

    if (this.slotStack.length > 0) {
        const top = this.slotStack[this.slotStack.length - 1]
        top.slot.appendChild(dom)
    } else {
        container.appendChild(dom)
    }

    if (node._isContainer) {
        this.slotStack.push({type: node.type, dom, slot})
    }
}
```

- [ ] **Step 1: 在元素 append 后统一添加动画类**

在 `mountStreaming()` 中，`dom` 已经 append 到父节点之后，添加：

```js
    // ... 现有 appendChild 逻辑 ...

    // 流式渲染元素进入动画
    if (dom.nodeType === Node.ELEMENT_NODE) {
        dom.classList.add('tokui-animate-in')
    }

    if (node._isContainer) {
        this.slotStack.push({type: node.type, dom, slot})
    }
```

完整改后代码：

```js
mountStreaming(node, container){
    const dom = this.render(node)

    let slot = dom.querySelector('.my-slot')
    if (!slot) {
        slot = dom
    }

    if (this.slotStack.length > 0) {
        const top = this.slotStack[this.slotStack.length - 1]
        top.slot.appendChild(dom)
    } else {
        container.appendChild(dom)
    }

    if (dom.nodeType === Node.ELEMENT_NODE) {
        dom.classList.add('tokui-animate-in')
    }

    if (node._isContainer) {
        this.slotStack.push({type: node.type, dom, slot})
    }
}
```

**说明:**
- `Node.ELEMENT_NODE` 是常量 `1`，确保只有元素节点加动画（文本节点不加类）。
- 静态渲染 `mount()` 不加动画，保持设计文档约定。

- [ ] **Step 2: 验证 renderer.js 无语法错误**

Run: `npm run build`
Expected: 构建成功。

---

### Task 3: 回归测试

**Files:**
- 不改文件，仅运行测试

- [ ] **Step 1: 运行解析器测试**

Run: `npm test`
Expected: 6 个测试全部通过。

- [ ] **Step 2: 运行生产构建**

Run: `npm run build`
Expected: 构建成功，输出 `dist/` 目录。

- [ ] **Step 3: 手动验证流式渲染动画**

Run:
```bash
npm run server
# 另一个终端
npm run dev
```

浏览器访问 Vite 提示的地址，点击「连接 SSE 流式渲染」。

Expected:
- card 容器先出现
- 标题、段落、row、col、btn 依次从下方淡入上滑
- 每个元素动画时长约 0.3s
- 静态 DSL 渲染时无动画

---

### Task 4: 提交

- [ ] **Step 1: 添加修改文件**

```bash
git add src/style/tokui.css src/core/renderer.js
```

- [ ] **Step 2: 提交**

```bash
git commit -m "feat: add fade-slide animation for streaming-rendered elements"
```

---

## 自审清单

| 设计文档要求 | 对应任务 |
|-------------|---------|
| 方案 A：淡入 + 上滑 | Task 1 定义 `tokui-fade-slide-in` |
| 动画参数：12px 位移、0.3s、ease-out | Task 1 CSS |
| 仅在流式渲染触发 | Task 2 仅在 `mountStreaming()` 添加 |
| 静态渲染不变 | Task 2 未修改 `mount()` |
| 支持 `prefers-reduced-motion` | Task 1 媒体查询 |
| `npm test` 通过 | Task 3 Step 1 |
| `npm run build` 通过 | Task 3 Step 2 |

**无占位符检查:** 所有步骤均包含具体代码和命令。

**类型一致性检查:** `mountStreaming` 中 `dom` 变量类型与 `Node.ELEMENT_NODE` 检查一致，无新类型冲突。

---

## 执行方式

Plan complete and saved to `docs/superpowers/plans/2026-07-24-streaming-animation-plan.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks
2. **Inline Execution** — execute tasks in this session using executing-plans

Which approach?
