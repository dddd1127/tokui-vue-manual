<template>
  <div class="app">
    <h1>TokUI Vue 手动实现</h1>

    <div class="controls">
      <button @click="renderStatic">渲染静态 DSL</button>
      <button @click="connectSSE">连接 SSE 流式渲染</button>
      <button @click="toggleTheme">切换主题</button>
    </div>

    <div class="theme-info">当前主题：{{ currentTheme }}</div>

    <TokUIView :stream="staticDsl" v-if="staticDsl" :theme="currentTheme" />
    <TokUIView sseUrl="http://localhost:3001/api/chat" v-if="useSSE" :theme="currentTheme" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TokUIView from './components/TokUIView.vue'

const staticDsl = ref('')
const useSSE = ref(false)
const currentTheme = ref('default')

function renderStatic() {
  useSSE.value = false
  staticDsl.value = `
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
  `
}

function connectSSE() {
  staticDsl.value = ''
  useSSE.value = true
}

function toggleTheme() {
  currentTheme.value = currentTheme.value === 'default' ? 'dark' : 'default'
  document.documentElement.setAttribute('data-theme', currentTheme.value)
}
</script>

<style scoped>
.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

h1 {
  margin-bottom: 20px;
  color: var(--tokui-text);
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.controls button {
  padding: 8px 16px;
  border: 1px solid var(--tokui-border);
  background: var(--tokui-bg);
  color: var(--tokui-text);
  border-radius: 4px;
  cursor: pointer;
}

.controls button:hover {
  border-color: var(--tokui-primary);
  color: var(--tokui-primary);
}

.theme-info {
  margin-bottom: 16px;
  color: var(--tokui-text-muted);
  font-size: 14px;
}
</style>
