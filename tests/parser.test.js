import assert from 'assert'
import { StreamingParser } from '../src/core/parser.js'

function parse(dsl) {
  const nodes = []
  const parser = new StreamingParser((node) => nodes.push(node))
  parser.startStream()
  parser.feed(dsl)
  parser.endStream()
  return nodes
}

console.log('Running parser tests...')

// Test 1: 自闭合标签
{
  const nodes = parse('[h1 Hello]')
  assert.strictEqual(nodes.length, 1)
  assert.strictEqual(nodes[0].type, 'h1')
  assert.strictEqual(nodes[0].content, 'Hello')
  console.log('✓ Test 1 passed: self-closing tag')
}

// Test 2: 容器嵌套
{
  const nodes = parse('[card tt:测试][p 内容][/card]')
  assert.strictEqual(nodes.length, 1)
  assert.strictEqual(nodes[0].type, 'card')
  assert.strictEqual(nodes[0].attrs.tt, '测试')
  assert.strictEqual(nodes[0].children.length, 1)
  assert.strictEqual(nodes[0].children[0].type, 'p')
  assert.strictEqual(nodes[0].children[0].content, '内容')
  console.log('✓ Test 2 passed: nested container')
}

// Test 3: 多个属性
{
  const nodes = parse('[btn v:primary clk:showDetail]点击[/btn]')
  assert.strictEqual(nodes[0].type, 'btn')
  assert.strictEqual(nodes[0].attrs.v, 'primary')
  assert.strictEqual(nodes[0].attrs.clk, 'showDetail')
  assert.strictEqual(nodes[0].content, '点击')
  console.log('✓ Test 3 passed: multiple attributes')
}

// Test 4: 多个同级节点
{
  const nodes = parse('[h1 A][h2 B][p C]')
  assert.strictEqual(nodes.length, 3)
  assert.strictEqual(nodes[0].type, 'h1')
  assert.strictEqual(nodes[1].type, 'h2')
  assert.strictEqual(nodes[2].type, 'p')
  console.log('✓ Test 4 passed: sibling nodes')
}

// Test 5: 流式分片输入
{
  const nodes = []
  const parser = new StreamingParser((node) => nodes.push(node))
  parser.startStream()
  parser.feed('[card tt:')
  parser.feed('流式]')
  parser.feed('[p 内容]')
  parser.feed('[/card]')
  parser.endStream()

  assert.strictEqual(nodes.length, 1)
  assert.strictEqual(nodes[0].type, 'card')
  assert.strictEqual(nodes[0].attrs.tt, '流式')
  assert.strictEqual(nodes[0].children.length, 1)
  assert.strictEqual(nodes[0].children[0].type, 'p')
  console.log('✓ Test 5 passed: streaming chunks')
}

// Test 6: row/col 布局
{
  const nodes = parse('[row][col A][/col][col B][/col][/row]')
  assert.strictEqual(nodes[0].type, 'row')
  assert.strictEqual(nodes[0].children.length, 2)
  assert.strictEqual(nodes[0].children[0].content, 'A')
  assert.strictEqual(nodes[0].children[1].content, 'B')
  console.log('✓ Test 6 passed: row/col layout')
}

// Test 7: 同类型容器嵌套
{
  const nodes = parse('[card tt:outer][p outer][card tt:inner][p inner][/card][/card]')
  assert.strictEqual(nodes.length, 1)
  assert.strictEqual(nodes[0].type, 'card')
  assert.strictEqual(nodes[0].attrs.tt, 'outer')
  assert.strictEqual(nodes[0].children.length, 2)
  assert.strictEqual(nodes[0].children[0].type, 'p')
  assert.strictEqual(nodes[0].children[0].content, 'outer')
  assert.strictEqual(nodes[0].children[1].type, 'card')
  assert.strictEqual(nodes[0].children[1].attrs.tt, 'inner')
  assert.strictEqual(nodes[0].children[1].children.length, 1)
  assert.strictEqual(nodes[0].children[1].children[0].type, 'p')
  assert.strictEqual(nodes[0].children[1].children[0].content, 'inner')
  console.log('✓ Test 7 passed: nested same-type containers')
}

console.log('\nAll parser tests passed!')
