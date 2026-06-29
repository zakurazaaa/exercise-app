# 💪 Exercise App

เว็บแอปค้นหาท่าออกกำลังกาย แสดงภาพเคลื่อนไหว (GIF) กล้ามเนื้อเป้าหมาย และวิธีทำทีละขั้น
สร้างด้วย **React + Vite** โดยดึงข้อมูลตรงจาก dataset
[hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) (1,324 ท่า)

## ฟีเจอร์

- 🔎 ค้นหาท่าจากชื่อ (เช่น `sit-up`, `push-up`, `squat`)
- 🎛️ กรองตามส่วนของร่างกาย / อุปกรณ์ / กล้ามเนื้อเป้าหมาย
- 🖼️ การ์ดพร้อมรูป thumbnail และ popup แสดง GIF + ขั้นตอนการทำ
- 📡 ข้อมูลดึงสดจาก GitHub raw — ไม่ต้องเก็บไฟล์ขนาดใหญ่ในโปรเจกต์

## เริ่มใช้งาน

```bash
npm install
npm run dev      # เปิด http://localhost:5173
npm run build    # build ขึ้น production ที่โฟลเดอร์ dist/
```

## โครงสร้าง

| ไฟล์ | หน้าที่ |
| --- | --- |
| `src/data.js` | โหลด/แคชข้อมูล และแปลง path รูป/GIF เป็น URL เต็ม |
| `src/App.jsx` | UI หลัก: ค้นหา ตัวกรอง การ์ด และ popup รายละเอียด |
| `src/App.css` | สไตล์ทั้งหมด (ธีมมืด) |

## เครดิตข้อมูล

ข้อมูลและสื่อทั้งหมดมาจาก
[hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)
**เพื่อการศึกษาและไม่ใช่เชิงพาณิชย์เท่านั้น**
