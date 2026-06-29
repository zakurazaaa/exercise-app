// แหล่งข้อมูลท่าออกกำลังกาย — ดึงตรงจาก GitHub raw ของ exercises-dataset
const REPO_BASE =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main";

export const DATA_URL = `${REPO_BASE}/data/exercises.json`;

// image / gif_url ใน dataset เป็น path แบบ relative (เช่น "videos/0001-x.gif")
// จึงต้องเติม base ของ repo เข้าไปก่อนใช้งานจริง
export function mediaUrl(relativePath) {
  if (!relativePath) return "";
  if (relativePath.startsWith("http")) return relativePath;
  return `${REPO_BASE}/${relativePath}`;
}

let cache = null;

export async function loadExercises() {
  if (cache) return cache;
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
  const raw = await res.json();
  // เผื่อกรณี root เป็น object ที่ห่อ array ไว้
  cache = Array.isArray(raw) ? raw : raw.exercises || Object.values(raw)[0];
  return cache;
}

// รวมค่าที่ไม่ซ้ำของ field ที่ต้องการ ไว้ทำ dropdown filter
export function uniqueValues(list, key) {
  return [...new Set(list.map((x) => x[key]).filter(Boolean))].sort();
}
