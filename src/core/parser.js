// 实现流式解析器

const CONTAINERS = new Set([
    'card', 'row', 'col', 'form','btn'
])

class StreamingParser {
    constructor(onNode, options = {}) {
        this.onNode = onNode
        this.onContainerClose = options.onContainerClose || null
        this.onText = options.onText || null
        this.streaming = options.streaming || false
        this.buffer = ''
        this.stack = []
        this.state = 'TEXT'
    }

    startStream() {
        this.buffer = ''
        this.stack = []
        this.state = 'TEXT'
    }

    //解析DSL：把文本追加到buffer，然后调用_tryParse()尝试解析
    feed(chunk) {
        this.buffer += chunk
        this._tryParse()
    }

    endStream() {
        // 把剩余 buffer 当作文本节点刷出
        this._flushText(this.buffer)
        this.buffer = ''
        // 自动补全未闭合的容器

        if (this.streaming) {
            //流式模式下：未闭合的容器只需要通知关闭
            while(this.stack.length>0){
                const node = this.stack.pop()
                if (this.onContainerClose) {
                    this.onContainerClose(node.type)
                }
            }
        } else {
            //静态模式下：把剩余未闭合节点当作完整节点发出
            while (this.stack.length > 0) {
                const node = this.stack.pop()
                this._completeNode(node)
            }
        }
    }

    _tryParse() {
        // 状态机：扫描 buffer 中的完整标签
        while (true) {
            const openIdx = this.buffer.indexOf('[')
            if (openIdx === -1) break

            // 标签前文本作为当前容器的内容
            const text = this.buffer.slice(0, openIdx)
            this._flushText(text)

            const closeIdx = this.buffer.indexOf(']', openIdx)
            if (closeIdx === -1) break // 标签不完整，等待更多数据

            //获取标签内容
            const raw = this.buffer.slice(openIdx + 1, closeIdx)
            this.buffer = this.buffer.slice(closeIdx + 1)

            //将标签内容交给_parseTag，_parseTag返回的内容由_handleTag处理开/闭标签
            this._handleTag(this._parseTag(raw))
        }
    }

    //文本节点处理
    _flushText(text) {
        if (!text || this.stack.length === 0) return
        if (this.streaming && this.onText) {
            //流式模式下：文本作为文本节点实时挂载
            this.onText(text)
        } else {
            //静态模式：文本累积到node.content
            const top = this.stack[this.stack.length - 1]
            top.content = (top.content ? top.content + text : text)
        }
    }

    //标签解析
    _parseTag(raw) {
        const trimmed = raw.trim()
        if (trimmed.startsWith('/')) {
            return { type: trimmed.slice(1), closing: true }
        }

        const tokens = trimmed.split(/\s+/)
        const type = tokens[0]
        const attrs = {}
        let content = ''
        for (let i = 1; i < tokens.length; i++) {
            const token = tokens[i]
            const colonIdx = token.indexOf(':')
            if (colonIdx > 0 && colonIdx < token.length - 1) {
                const key = token.slice(0, colonIdx)
                const value = token.slice(colonIdx + 1)
                attrs[key] = value
            } else {
                content += (content ? ' ' : '') + token
            }
        }
        return { type, attrs, content, closing: false }
    }

    _handleTag(tag) {
        if (tag.closing) {
            // 找到匹配的开启节点
            const idx = this.stack.findLastIndex(n => n.type === tag.type)
            if (idx === -1) return // 没有匹配的开标签，忽略
            // 关闭 idx 之上的所有节点（容错）
            const nodes = this.stack.splice(idx)
            const node = nodes[0]
            if (this.streaming) {
                //流式模式：通知渲染器该容器关闭了
                if (this.onContainerClose) {
                    this.onContainerClose(node.type)
                }
            } else {
                //静态模式：把整颗子树emit出去
                this._completeNode(node)
            }
        } else {
            //确定是否是容器
            const isContainer = CONTAINERS.has(tag.type) || tag.content === ''
            const node = { 
                type: tag.type, 
                attrs: tag.attrs, 
                content: tag.content, 
                children: [],
                _isContainer: isContainer
             }
            if (isContainer) {
                //是容器，调用onNode
                this.stack.push(node)
                if (this.streaming) {
                    //流式模式：容器一开就渲染外壳
                    this.onNode(node)
                }
            } else {
                //如果是叶子节点，先调用_completeNode，再调用onNode
                this._completeNode(node)
            }
        }
    }

    _completeNode(node) {
        if (this.stack.length > 0) {
            this.stack[this.stack.length - 1].children.push(node)
        }
        
        if (this.streaming) {
            //流式模式：每完成一个节点就立即emit
            this.onNode(node)
        } else if(this.stack.length === 0) {
            //静态模式：只有栈空时才emit
            this.onNode(node)
        }
    }
}

export { StreamingParser }
