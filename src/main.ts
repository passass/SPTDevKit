import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import VueVirtualScroller from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const pinia = createPinia()
const app = createApp(App)
app.use(VueVirtualScroller)


app.use(pinia)
app.mount('#app')