import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

import './assets/styles.scss'
import './assets/style.css'

const app = createApp(App)
app.use(router)


window.electronAPI.getAppVersion().then((version: string) => {
  document.title = `sikul v${version}`;
});

app.mount('#app')