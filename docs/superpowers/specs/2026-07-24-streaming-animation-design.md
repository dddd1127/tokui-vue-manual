# TokUI 流式渲染出现动画设计

## 背景

当前 TokUI 的 SSE 流式渲染已能正常工作，解析器支持分片输入、渲染器支持 slotStack 增量挂载。但每个 DSL 节点进入页面时是「硬切」直接 append，视觉体验呆板，缺少「AI 正在逐字/逐块生成」的优雅感。

## 目标

为流式渲染中新挂载的 DOM 节点添加统一的淡入上滑动画，使 SSE 输出看起来像卡片内容在逐步生长，而非一次性闪现。

## 设计选择

用户已选择 **方案 A：淡入 + 上滑**。

| 方案 | 描述 | 选择 |
|------|------|------|
| A | 每个元素从下方 12px 淡入上滑，0.25-0.35s | ✅ 已选 |
| B | 底部保留闪烁光标，强调 AI 生成 | 未选 |
| C | 卡片容器先出现，子元素再依次填入 | 未选 |

选择 A 的原因：
- 最自然，不干扰阅读
- 实现最轻量，只需 CSS 关键帧 + 类名
- 与现有 `my-*` 组件类体系兼容
- 不破坏原有布局结构

## 动画参数

```css
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
```

- 位移：12px 向上
- 时长：0.3s
- 缓动：ease-out-ish（cubic-bezier(0.25, 0.46, 0.45, 0.94)）
- 填充模式：both（保持起始和结束状态）

## 触发机制

仅在**流式渲染**时触发，静态渲染不添加动画。

触发点：`Renderer.mountStreaming()` 中，新节点 append 到 DOM 后，立即添加 `.tokui-animate-in` 类。

```js
// renderer.js
mountStreaming(node, container) {
  // ... 现有挂载逻辑 ...

  if (dom.animateIn !== false) {
    dom.classList.add('tokui-animate-in')
  }
}
```

> 部分元素（如 `hr`）可能不需要动画，但为统一性先全部添加，后续可细化。

## 层级元素处理

流式渲染的层级结构：

```
.tokui-stream
  └─ .my-card
       ├─ .my-card__title
       └─ .my-card__body.my-slot
            ├─ .my-h1  (动画)
            ├─ .my-p   (动画)
            ├─ .my-row (动画)
            │     ├─ .my-col (动画)
            │     └─ .my-col (动画)
            └─ .my-btn (动画)
```

每个新元素独立动画。由于 SSE 间隔 400ms 推送一个片段，视觉上会自然形成依次出现的效果，无需额外 stagger delay。

## 兼容性

- 使用 CSS `@keyframes` 和 `classList.add`，无需第三方动画库
- 支持 `prefers-reduced-motion` 媒体查询（可选增强）

## 不改动范围

- 静态渲染 `Renderer.mount()` 不添加动画
- 解析器逻辑不变
- 组件渲染函数不变
- SSE 数据流不变

## 验收标准

- [ ] 启动 SSE 后，card、标题、段落、row、col、btn 依次淡入上滑出现
- [ ] 静态 DSL 渲染保持原样，无动画
- [ ] `npm test` 通过
- [ ] `npm run build` 通过
- [ ] 无明显布局抖动或回流卡顿
