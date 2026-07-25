import assert from 'assert'
import { setupDOM, teardownDOM } from './helpers/dom-mock.js'

console.log('Running useTokUIStream tests...')

setupDOM()

// 模拟 fetch：第一次调用返回失败的响应
const originalFetch = global.fetch
const testError = new Error('Network error')
global.fetch = async () => {
  throw testError
}

// 动态导入 useTokUIStream，确保 DOM mock 先就绪
const { useTokUIStream } = await import('../src/composables/core/useTokUIStream.js')

// Test 1: connect 失败时应把错误信息写入 error ref
{
  const { error, isStreaming, connect } = useTokUIStream()
  const container = document.createElement('div')

  assert.strictEqual(error.value, null, 'error should start as null')

  await connect('http://test.example.com', {}, container)

  assert.strictEqual(isStreaming.value, false, 'isStreaming should be false after error')
  assert.ok(error.value, 'error should be set')
  assert.ok(error.value.includes('Network error'), `Expected error to include 'Network error', got '${error.value}'`)

  console.log('✓ Test 1 passed: useTokUIStream error ref is set on fetch failure')
}

global.fetch = originalFetch
teardownDOM()

console.log('\nAll useTokUIStream tests passed!')
