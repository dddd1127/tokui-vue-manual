//实现基础组件
export function registerBasic(renderer){
    //h1-h6
    for (let i = 0; i <= 6; i++) {
        renderer.register(`h${i}`,(node)=>{
            const el = document.createElement(`h${i}`)
            el.className = `my-h${i}`
            el.textContent = node.content || ''
            return el
        })
    }

    renderer.register('p',(node,rc)=>{
        const el = document.createElement('p')
        el.className = 'my-p'
        el.textContent = node.content || ''
        rc(node.children).forEach(child => el.appendChild(child))
        return el
    })

    renderer.register('hr',()=>{
        return document.createElement('hr')
    })

    renderer.register('img',(node)=>{
        const el = document.createElement('img')
        el.className = 'my-img'
        el.src = node.attrs.s || ''
        if (node.attrs.u) {
            const a = document.createElement('a')
            a.href = node.attrs.u
            a.target = '_blank'
            a.appendChild(el)
            return a
        }
        return el
    })

}