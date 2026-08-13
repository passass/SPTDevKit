import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
// import ListTabs from './components/ListTabs.vue'

const pinia = createPinia() // Создаём экземпляр
const app = createApp(App)

app.use(pinia) // Подключаем к приложению
app.mount('#app')