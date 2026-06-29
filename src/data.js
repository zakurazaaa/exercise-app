// แหล่งข้อมูลท่าออกกำลังกาย
// - index เบา (~194KB) ฝังในแอป → โหลดเร็ว ใช้ทำ grid/ค้นหา/กรอง/หมวด
// - รายละเอียดเต็ม (วิธีทำ/GIF/กล้ามเนื้อเสริม ~6MB) ดึงจาก GitHub raw แบบ lazy
const REPO_BASE =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main";

export const DATA_URL = `${REPO_BASE}/data/exercises.json`;

// image / gif_url ใน dataset เป็น path แบบ relative (เช่น "videos/0001-x.gif")
export function mediaUrl(relativePath) {
  if (!relativePath) return "";
  if (relativePath.startsWith("http")) return relativePath;
  return `${REPO_BASE}/${relativePath}`;
}

// โหลด index เบาที่ฝังในแอป (เสิร์ฟที่ BASE_URL)
let indexCache = null;
export async function loadIndex() {
  if (indexCache) return indexCache;
  const res = await fetch(`${import.meta.env.BASE_URL}exercises-index.json`);
  if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
  indexCache = await res.json();
  return indexCache;
}

// โหลดรายละเอียดเต็มครั้งเดียว (lazy) แล้วทำเป็น map: id -> รายละเอียด
let detailsPromise = null;
export function loadDetailsMap() {
  if (!detailsPromise) {
    detailsPromise = fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((raw) => {
        const arr = Array.isArray(raw) ? raw : raw.exercises || Object.values(raw)[0];
        const map = {};
        for (const e of arr) {
          map[e.id] = {
            gif_url: e.gif_url,
            instruction_steps: e.instruction_steps,
            secondary_muscles: e.secondary_muscles,
            muscle_group: e.muscle_group,
          };
        }
        return map;
      })
      .catch(() => ({})); // ถ้าโหลดไม่ได้ คืน map ว่าง (โมดัลจะแสดงเท่าที่มี)
  }
  return detailsPromise;
}

// รวมค่าที่ไม่ซ้ำของ field ที่ต้องการ ไว้ทำ dropdown filter
export function uniqueValues(list, key) {
  return [...new Set(list.map((x) => x[key]).filter(Boolean))].sort();
}
