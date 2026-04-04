import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { initializeAppStores } from './stores'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
initializeAppStores(pinia)
app.mount('#app')
