<template>
    <div ref="containerRef" class="tokui-view" :data-theme="theme">

    </div>
</template>

<script setup>
    import { ref, onMounted, onUnmounted, watch } from 'vue';
    import { TokUI } from '../core/tokui';
    const props = defineProps({
        stream: String,
        sseUrl: String,
        sseBody: {type: Object, default:()=>({})},
        theme:{type:String, default:'default'}
    })

    const containerRef = ref(null)

    let tokui = null
    onMounted(()=>{
        if (!containerRef.value) return

        tokui = new TokUI({container: containerRef.value})

        if (props.stream) {
            tokui.render(props.stream)
        }else if(props.sseUrl){
            tokui.connect(props.sseUrl, props.sseBody)
        }
    })

    onUnmounted(()=>{
        if (tokui) {
            tokui.endStream()
            tokui = null
        }
    })

    watch(()=>props.stream,(newDsl) => {
        if (tokui && newDsl) {
            containerRef.value.innerHTML = ''
            tokui.render(newDsl)
        }
    })
</script>

<style lang="scss" scoped>

</style>