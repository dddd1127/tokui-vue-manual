# TokUI Vue 手动实现

一个基于 Vue 3 + Vite 的轻量级 DSL 渲染引擎，通过类 Markdown 标签语法将结构化内容渲染为 UI 组件。支持静态 DSL 渲染与 SSE 流式渲染两种模式，并提供默认 / 暗色两套主题。

---

## 技术栈

- **Vue 3** + `<script setup>` 单文件组件
- **Vite 5** 构建工具
- 原生 JavaScript（无 UI 组件库依赖）
- Node.js 原生 `http` 模块实现 SSE 演示后端

---

## 功能特性

- 📝 **轻量 DSL**：使用 `[card]`、`[h1]`、`[row]`、`[btn]` 等标签描述界面。
- 🌊 **流式渲染**：通过 Server-Sent Events（SSE）分片接收 DSL，边收边渲染。
- 🎨 **主题切换**：内置 `default`（浅色）与 `dark`（暗色）主题，运行时一键切换。
- 🧩 **可扩展组件**：渲染器注册表支持按需扩展新组件。
- ⚡️ **Vue 组合式函数**：提供 `useTokUIStream` 便于在 Vue 组件中接入流式渲染。
- ✅ **单元测试**：包含 DSL 解析器的基础测试用例。

---

## 项目结构

```
.
├── index.html              # 入口 HTML
├── package.json
├── vite.config.js          # Vite 配置
├── server/
│   └── sse-server.js       # SSE 演示后端
├── src/
│   ├── App.vue             # 示例页面
│   ├── main.js             # 应用入口
│   ├── style.css           # 基础全局样式
│   ├── style/tokui.css     # TokUI 主题与组件样式
│   ├── components/
│   │   └── TokUIView.vue   # TokUI 渲染 Vue 组件
│   ├── components-lib/
│   │   ├── index.js        # 注册全部组件
│   │   ├── basic.js        # 基础组件：h1-h6、p、hr、img
│   │   ├── layout.js       # 布局组件：card、row、col、form
│   │   └── form.js         # 表单组件：btn
│   ├── composables/core/
│   │   └── useTokUIStream.js  # 流式渲染组合式函数
│   └── core/
│       ├── tokui.js        # TokUI 主类：渲染、流式、SSE 连接
│       ├── parser.js       # 流式 DSL 解析器
│       ├── renderer.js     # DOM 渲染器
│       └── event-bus.js    # 事件总线
└── tests/
    └── parser.test.js      # 解析器测试
```

---

## DSL 语法

TokUI 使用方括号标签描述 UI，类似简化版 HTML：

```
[card tt:用户信息]
  [h1 张三]
  [p v:muted]高级工程师[/p]
  [row]
    [col]邮箱[/col]
    [col]zhangsan@example.com[/col]
  [/row]
  [row]
    [col]部门[/col]
    [col]前端架构[/col]
  [/row]
  [btn v:primary clk:showDetail]查看详情[/btn]
[/card]
```

### 标签规则

- 自闭合标签：`[h1 标题内容]`、`[hr]`
- 容器标签：`[card]`、`[row]`、`[col]`、`[form]`、`[btn]` 需成对闭合 `[/card]` 等
- 属性：`key:value` 形式，多个属性用空格分隔
- 变体：使用 `v:` 属性添加变体类名，例如 `v:primary`
- 点击事件：按钮使用 `clk:eventName`，由事件总线注册处理

### 内置组件

| 组件 | 说明 | 示例 |
|------|------|------|
| `h1` ~ `h6` | 标题 | `[h1 大标题]` |
| `p` | 段落 | `[p v:muted]灰色文本[/p]` |
| `hr` | 分隔线 | `[hr]` |
| `img` | 图片，`s` 为 src，`u` 为链接 | `[img s:./logo.png u:https://example.com]` |
| `card` | 卡片，`tt` 为标题 | `[card tt:卡片标题]...[/card]` |
| `row` / `col` | 行列布局 | `[row][col]A[/col][col]B[/col][/row]` |
| `form` | 表单容器 | `[form]...[/form]` |
| `btn` | 按钮，`clk` 绑定点击事件 | `[btn v:primary clk:submit]提交[/btn]` |

---

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

默认服务运行在 Vite 配置的端口（通常为 `http://localhost:5173`）。

### 启动 SSE 演示后端

流式渲染需要配合后端服务：

```bash
npm run server
```

服务监听 `http://localhost:3001/api/chat`，会按 400ms 间隔逐段返回 DSL。

### 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 本地预览生产构建

```bash
npm run preview
```

---

## 运行测试

```bash
npm test
```

当前测试覆盖 DSL 解析器的静态解析、容器嵌套、多属性、同级节点、流式分片与布局等场景。

---

## 在 Vue 中使用

### 使用 TokUIView 组件

```vue
<template>
  <TokUIView :stream="dsl" theme="default" />
  <TokUIView sseUrl="http://localhost:3001/api/chat" theme="dark" />
</template>

<script setup>
import { ref } from 'vue'
import TokUIView from './components/TokUIView.vue'

const dsl = ref(`[h1 Hello TokUI]`)
</script>
```

### 使用组合式函数

```vue
<template>
  <div ref="containerRef"></div>
  <button @click="start">开始流式渲染</button>
</template>

<script setup>
import { ref } from 'vue'
import { useTokUIStream } from './composables/core/useTokUIStream.js'

const containerRef = ref(null)
const { connect, isStreaming, error } = useTokUIStream()

async function start() {
  await connect('http://localhost:3001/api/chat', {}, containerRef.value)
}
</script>
```

### 主题切换

通过设置 HTML 根元素的 `data-theme` 属性切换主题：

```js
document.documentElement.setAttribute('data-theme', 'dark')
```

支持 `default` 与 `dark` 两种主题。

### 事件总线

在 `main.js` 中注册事件处理函数：

```js
import { eventBus } from './core/event-bus.js'

eventBus.register('showDetail', (payload) => {
  console.log('查看详情', payload)
})
```

DSL 中按钮点击将触发对应事件：

```
[btn clk:showDetail]查看详情[/btn]
```

---

## 扩展组件

通过 `Renderer.register` 注册自定义组件：

```js
import { TokUI } from './core/tokui.js'

const tokui = new TokUI({ container: '#app' })
tokui.renderer.register('badge', (node) => {
  const el = document.createElement('span')
  el.className = 'my-badge'
  el.textContent = node.content || ''
  return el
})

tokui.render('[badge 新消息]')
```

---

## 开发计划（持续更新）

- [x] DSL 解析器（静态 + 流式）
- [x] 基础组件、布局组件、按钮组件
- [x] SSE 流式渲染与演示后端
- [x] 默认 / 暗色主题
- [x] 事件总线
- [ ] 更多表单组件（输入框、选择器等）
- [ ] 更完善的错误处理与边界情况

---

## License

MIT
