import { ref } from "vue";
import { TokUI } from "../../core/tokui.js";

export function useTokUIStream(){
    const dsl = ref('')
    const isStreaming = ref(false)
    const error = ref(null)
    let tokui = null

    async function connect(url, body = {}, container) {
        if (!container) {
            throw new Error('useTokUIStream: container is required')
        }

        isStreaming.value = true
        error.value = null
        dsl.value = ''

        try {
            tokui = new TokUI({ container })

            const response = await fetch(url, {
                method:'POST',
                headers:{'content-Type':'application/json'},
                body:JSON.stringify(body)
            })

            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            const streamTarget = document.createElement('div')
            streamTarget.className = 'tokui-stream'
            container.appendChild(streamTarget)
            tokui.startStream(streamTarget)

            while (true) {
                const {done, value} = await reader.read()
                if (done) {
                    break
                }

                buffer += decoder.decode(value,{stream:true})
                const lines = buffer.split('\n')
                buffer = lines.pop()

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    const data = line.slice(6)

                    if (data === '[DONE]') {
                        tokui.endStream()
                        isStreaming.value = false
                        return 
                    }

                    try {
                       const json = JSON.parse(data)
                       if (json.tokui) {
                        dsl.value += json.tokui
                        tokui.feed(json.tokui)
                       } 
                    } catch (error) {
                        console.warn('Invalid SSE data',line)
                    }
                }
            }

            tokui.endStream()
            isStreaming.value = false
        } catch (err) {
            error.value = err.message
            isStreaming.value = false
        }
    }

    return {
        dsl,
        isStreaming,
        error,
        connect
    }
}