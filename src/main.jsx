import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// อัปเดตอัตโนมัติ: ใช้เวอร์ชันใหม่ทันทีเมื่อมี + เช็กอัปเดตทุก 30 นาที (กัน SW ค้างเวอร์ชันเก่า)
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (reg) setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000)
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
