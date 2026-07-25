//实现布局组件
export function registerLayout(renderer){
    renderer.register('card',(node,rc)=>{
        const el = document.createElement('div')
        el.className = 'my-card'

        if (node.attrs.tt) {
            const title = document.createElement('div')
            title.className = 'my-card__title'
            title.textContent = node.attrs.tt
            el.appendChild(title)
        }

        const body = document.createElement('div')
        body.className = 'my-card__body my-slot'
        rc(node.children).forEach(child => body.appendChild(child))
        el.appendChild(body)

        return el
    })

    renderer.register('row',(node, rc)=>{
        const el = document.createElement('div')
        el.className = 'my-row my-slot'
        el.textContent = node.content || ''
        rc(node.children).forEach(child=>el.appendChild(child))
        return el
    })

    renderer.register('col',(node,rc)=>{
        const el = document.createElement('div')
        el.className = 'my-col my-slot'
        el.textContent = node.content || ''
        rc(node.children).forEach(child => el.appendChild(child))
        return el
    })

    renderer.register('form',(node, rc) => {
        const el = document.createElement('form')
        el.className = 'my-form my-slot'
        rc(node.children).forEach(child => el.appendChild(child))
        return el
    })

}