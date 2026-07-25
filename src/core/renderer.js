//实现渲染器

class Renderer{
    constructor(eventBus){
        this.registry = {}
        this.eventBus = eventBus
        this.slotStack = []
    }

    register(type, renderFn){
        this.registry[type] = renderFn
    }

    //创建真正的DOM
    render(node){

        if (node.type === '_text') {
            return document.createTextNode(node.content)
        }

        const fn = this.registry[node.type]
        if (!fn) {
            return this._renderUnknow(node)
        }

        const self = this
        const rc = (children) => {
            return (children || []).map(c => self.render(c))
        }

        try{
            const dom = fn(node, rc)
            this._applyVariants(dom, node)
            return dom
        } catch (err) {
            console.warn('Render error', node.type, err)
            return this._renderError(node, err)
        }
    }

    _renderUnknow(node){
        const el = document.createElement('div')
        el.className = 'my-unknown'
        el.textContent = `[未知： ${node.type}] ${node.content || ''}`
        return el
    }

    _renderError(node, err){
        const el = document.createElement('div')
        el.className = 'my-error'
        el.textContent = `[渲染失败: ${node.type}] ${err.message}`
        return el
    }

    _applyVariants(dom, node){
        const v = node.attrs && node.attrs.v
        if (!v || !dom || dom.nodeType !== 1) {
            return
        }
        v.split(',').forEach(name => {
            dom.classList.add(`my-${node.type}--${name.trim()}`)
        })
    }

    mount(node, container){
        const dom = this.render(node)
        container.appendChild(dom)
    }

    //流式挂载到DOM上
    mountStreaming(node, container){
        //根据组件类型创建真实DOM
        const dom = this.render(node)

        //优先使用组件内部暴露的slot区域
        let slot = dom.querySelector('.my-slot')

        if (!slot) {
            slot = dom
        }

        if (this.slotStack.length > 0) {
            //如果当前有父容器，就把DOM挂到父容器的.my-slot里
            const top = this.slotStack[this.slotStack.length - 1]
            top.slot.appendChild(dom)
        }else{
            
            container.appendChild(dom)
        }

        if (dom.nodeType === Node.ELEMENT_NODE) {
            dom.classList.add('tokui-animate-in')
        }

        if (node._isContainer) {
            //如果当前节点是容器，就把自己压入slotStack，后续子节点会挂进这个slot
            this.slotStack.push({type:node.type, dom, slot})
        }
    }
    
    closeContainer(type){
        // LIFO 出栈：从栈顶弹出，直到遇到匹配的容器类型
        // 中间被弹出的容器是该类型的后代容器，一并关闭
        while (this.slotStack.length > 0) {
            const top = this.slotStack.pop()
            if (top.type === type) {
                break
            }
        }
    }

    //文本节点处理
    mountText(text, container){
        const trimmed = text.trim()
        if (!trimmed) {
            return 
        }

        const textNode = document.createTextNode(trimmed)
        if (this.slotStack.length > 0) {
            const top = this.slotStack[this.slotStack.length - 1]
            top.slot.appendChild(textNode)
        } else {
            container.appendChild(textNode)
        }
    }

}



export { Renderer }