//表单按钮组件

export function registerForm(renderer, eventBus){
    renderer.register('btn',(node,rc)=>{
        const el = document.createElement('button')
        el.className = 'my-btn'
        el.textContent = node.content || ''

        if (node.attrs.clk) {
            el.addEventListener('click',()=>{
                eventBus.emit(node.attrs.clk,{
                    type:'click',
                    target:el
                })
            })
        }
        return el
    })
}