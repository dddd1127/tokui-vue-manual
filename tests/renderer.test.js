import assert from 'assert'
import { setupDOM, teardownDOM } from './helpers/dom-mock.js'
import { Renderer } from '../src/core/renderer.js'

console.log('Running renderer tests...')

setupDOM()

// 注册一个 card 组件：带 .my-card 外壳和 .my-slot 插槽
function registerCard(renderer) {
  renderer.register('card', (node, rc) => {
    const el = document.createElement('div')
    el.className = 'my-card'
    const title = node.attrs.tt
    if (title) {
      const titleEl = document.createElement('div')
      titleEl.className = 'my-card__title'
      titleEl.textContent = title
      el.appendChild(titleEl)
    }
    const body = document.createElement('div')
    body.className = 'my-card__body my-slot'
    ;(node.children || []).forEach(c => {
      body.appendChild(rc([c])[0])
    })
    el.appendChild(body)
    return el
  })
}

// 注册一个简单的 p 组件
function registerP(renderer) {
  renderer.register('p', (node, rc) => {
    const el = document.createElement('p')
    el.className = 'my-p'
    if (node.content) el.textContent = node.content
    ;(node.children || []).forEach(c => el.appendChild(rc([c])[0]))
    return el
  })
}

// 注册一个简单的 btn 组件
function registerBtn(renderer) {
  renderer.register('btn', (node, rc) => {
    const el = document.createElement('button')
    el.className = 'my-btn'
    if (node.content) el.textContent = node.content
    return el
  })
}

// Test 1: _applyVariants 应给 DOM 添加变体类名
{
  const renderer = new Renderer()
  registerBtn(renderer)
  const dom = renderer.render({ type: 'btn', attrs: { v: 'primary' }, content: 'Click', children: [] })
  assert.ok(dom.className.includes('my-btn--primary'), `Expected class to include 'my-btn--primary', got '${dom.className}'`)
  console.log('✓ Test 1 passed: _applyVariants adds variant class')
}

// Test 2: 多变体应拆分为多个类名
{
  const renderer = new Renderer()
  registerBtn(renderer)
  const dom = renderer.render({ type: 'btn', attrs: { v: 'primary,lg' }, content: 'Click', children: [] })
  assert.ok(dom.className.includes('my-btn--primary'), `Expected class to include 'my-btn--primary', got '${dom.className}'`)
  assert.ok(dom.className.includes('my-btn--lg'), `Expected class to include 'my-btn--lg', got '${dom.className}'`)
  console.log('✓ Test 2 passed: multiple variants split into classes')
}

// Test 3: 流式渲染嵌套同类型容器时 closeContainer 只关闭当前容器
{
  const renderer = new Renderer()
  registerCard(renderer)
  registerP(renderer)

  const root = document.createElement('div')
  renderer.mountStreaming({ type: 'card', attrs: { tt: 'outer' }, content: '', children: [], _isContainer: true }, root)
  renderer.mountStreaming({ type: 'p', attrs: {}, content: 'outer content', children: [], _isContainer: false }, root)
  renderer.mountStreaming({ type: 'card', attrs: { tt: 'inner' }, content: '', children: [], _isContainer: true }, root)
  renderer.mountStreaming({ type: 'p', attrs: {}, content: 'inner content', children: [], _isContainer: false }, root)

  // 关闭 inner card 后，slotStack 应只剩下 outer card
  renderer.closeContainer('card')
  assert.strictEqual(renderer.slotStack.length, 1, `Expected slotStack length 1 after closing inner card, got ${renderer.slotStack.length}`)
  assert.strictEqual(renderer.slotStack[0].type, 'card', `Expected top type 'card', got '${renderer.slotStack[0].type}'`)

  // 再关闭 outer card，slotStack 应为空
  renderer.closeContainer('card')
  assert.strictEqual(renderer.slotStack.length, 0, `Expected slotStack length 0 after closing outer card, got ${renderer.slotStack.length}`)

  // 验证 DOM 结构：outer card 的 body 里有两个子节点（p outer + inner card）
  const outerCard = root.children[0]
  const outerBody = outerCard.querySelector('.my-slot')
  assert.ok(outerBody, 'outer card body should exist')
  assert.strictEqual(outerBody.childNodes.length, 2, `Expected 2 children in outer body, got ${outerBody.childNodes.length}`)

  console.log('✓ Test 3 passed: nested same-type containers close correctly')
}

// Test 4: 流式渲染 row 嵌套 row 场景
{
  const renderer = new Renderer()
  renderer.register('row', (node, rc) => {
    const el = document.createElement('div')
    el.className = 'my-row my-slot'
    ;(node.children || []).forEach(c => el.appendChild(rc([c])[0]))
    return el
  })
  renderer.register('col', (node, rc) => {
    const el = document.createElement('div')
    el.className = 'my-col'
    if (node.content) el.textContent = node.content
    return el
  })

  const root = document.createElement('div')
  renderer.mountStreaming({ type: 'row', attrs: {}, content: '', children: [], _isContainer: true }, root)
  renderer.mountStreaming({ type: 'col', attrs: {}, content: 'A', children: [], _isContainer: false }, root)
  renderer.mountStreaming({ type: 'row', attrs: {}, content: '', children: [], _isContainer: true }, root)
  renderer.mountStreaming({ type: 'col', attrs: {}, content: 'B', children: [], _isContainer: false }, root)
  renderer.closeContainer('row')

  assert.strictEqual(renderer.slotStack.length, 1, `Expected slotStack length 1 after closing inner row, got ${renderer.slotStack.length}`)
  assert.strictEqual(renderer.slotStack[0].type, 'row', `Expected top type 'row', got '${renderer.slotStack[0].type}'`)

  console.log('✓ Test 4 passed: nested same-type rows close correctly')
}

teardownDOM()

console.log('\nAll renderer tests passed!')
