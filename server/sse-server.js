import http from 'http'

/**
 * TokUI SSE 演示后端
 * 模拟大模型流式返回 DSL 片段
 */

const chunks = [
  '[card tt:订单信息]',
  '[h1 订单 #12345]',
  '[p v:muted]2024-01-15 创建[/p]',
  '[hr]',
  '[row]',
  '[col]商品[/col]',
  '[col]机械键盘[/col]',
  '[/row]',
  '[row]',
  '[col]状态[/col]',
  '[col]已发货[/col]',
  '[/row]',
  '[row]',
  '[col]地址[/col]',
  '[col]湖南省长沙市岳麓区[/col]',
  '[/row]',
  '[btn v:primary clk:trackOrder]查看物流[/btn]',
  '[/card]',
  '[card tt:用户信息]',
  '[h1 张三]',
  '[p v:muted]高级工程师[/p]',
  '[row]',
  '[col]邮箱[/col]',
  '[col]zhangsan@example.com[/col]',
  '[/row]',
  '[row]',
  '[col]部门[/col]',
  '[col]前端架构[/col]',
  '[/row]',
  '[btn v:primary clk:showDetail]查看详情[/btn]',
  '[/card]'
]

const server = http.createServer((req, res) => {
  // 处理 CORS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    })
    res.end()
    return
  }

  if (req.url !== '/api/chat' || req.method !== 'POST') {
    res.writeHead(404)
    res.end()
    return
  }

  // 读取请求体（可选：根据 prompt 返回不同内容）
  let body = ''
  req.on('data', (chunk) => {
    body += chunk
  })

  req.on('end', () => {
    try {
      const json = body ? JSON.parse(body) : {}
      console.log('Received prompt:', json.prompt || '(empty)')
    } catch (e) {
      console.log('Invalid JSON body, using default demo')
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type'
    })

    let i = 0
    const interval = setInterval(() => {
      if (i >= chunks.length) {
        res.write('data: [DONE]\n\n')
        clearInterval(interval)
        res.end()
        return
      }

      const data = JSON.stringify({ tokui: chunks[i] })
      res.write(`data: ${data}\n\n`)
      i++
    }, 200)
  })
})

const PORT = 3001
server.listen(PORT, () => {
  console.log(`SSE server running at http://localhost:${PORT}`)
  console.log(`Try: curl -N -X POST http://localhost:${PORT}/api/chat -H "Content-Type: application/json" -d '{"prompt":"test"}'`)
})
