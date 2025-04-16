import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

import './assets/styles.scss'
import './assets/style.css'



const app = createApp(App)
app.use(router)
app.mount('#app')