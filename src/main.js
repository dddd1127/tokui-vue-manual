import { createApp } from 'vue'
import './style.css'
import './style/tokui.css'
import App from './App.vue'
import { eventBus } from './core/event-bus.js'

eventBus.register('showDetail', () => {
  alert('查看详情')
})

eventBus.register('trackOrder', () => {
  alert('查看物流')
})

createApp(App).mount('#app')
