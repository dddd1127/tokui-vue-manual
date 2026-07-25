import { StreamingParser } from "./parser.js";
import { Renderer } from "./renderer.js";
import { eventBus, EventBus } from "./event-bus.js";
import { registerAll } from "../components-lib/index.js";


class TokUI{
    constructor(options = {}){
        //保存container容器
        this.container = typeof options.container === 'string'? document.querySelector(options.container):options.container

        if (!this.container) {
            throw new Error('TokUI: container is required')
        }
        //新建Renderer实例，负责把解析出的节点变成真实DOM
        this.renderer = new Renderer(eventBus)
        //调用registerAll，把所有组件注册到渲染器中
        registerAll(this.renderer, eventBus)

        this.parser = null
        this.streamingContainer = null
    }

    render(dsl){
        const parser = new StreamingParser((node)=>{
            this.renderer.mount(node, this.container)
        })

        parser.startStream()
        parser.feed(dsl)
        parser.endStream()
    }

    startStream(targetContainer){
        this.streamingContainer = targetContainer || this.container
        //创建StreamingParser时传了三个回调
        this.parser = new StreamingParser(
            //每解析出一个节点，就调用renderer.mountStreaming(node,流式容器)
            (node)=>{
                this.renderer.mountStreaming(node, this.streamingContainer)
            },{
                streaming:true,
                //容器关闭时调用this.renderer.closeContainer(type)
                onContainerClose:(type) => {
                    this.renderer.closeContainer(type)
                },
                //每解析出一段文本，就调用this.renderer.mountText(text,流式容器)
                onText:(text) => {
                    this.renderer.mountText(text,this.streamingContainer)
                }
            }
        )
        this.parser.startStream()
    }

    feed(chunk){
        if (this.parser) {
            //喂入DSL片段
            this.parser.feed(chunk)
        }
    }

    endStream(){
        if (this.parser) {
            this.parser.endStream()//清空剩余buffer、关闭未闭合容器
            this.renderer.slotStack = []//清空renderer.slotStack
            this.parser = null//释放parser
        }
    }

    async connect(url, body={}){
        //fetch请求后端
        const response = await fetch(url, {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify(body)
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        //创建独立的class=tokui-stream流式容器
        const streamTarget = document.createElement('div')
        streamTarget.className = 'tokui-stream'
        //挂载到container
        this.container.appendChild(streamTarget)
        //开始流式解析
        this.startStream(streamTarget)

        //读取sse数据流
        const read = async()=>{
            const {done, value} = await reader.read()
            if (done) {
                this.endStream()
                return
            }

            buffer += decoder.decode(value, {stream:true})
            //按\n分割成SSE行
            const lines = buffer.split('\n')
            buffer = lines.pop()

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue

                const data = line.slice(6).trim()
                if (data==='[DONE]') {
                    this.endStream()
                    return 
                }

                try {
                    //解析JSON，把json.tokui字符串喂给解析器
                    const json = JSON.parse(data)
                    if (json.tokui) {
                        this.feed(json.tokui)
                    }
                } catch (e) {
                    console.warn('Invaild SSE data',line)
                }
            }
            read()
        }
        read()
    }
}

export {TokUI, eventBus}