// แปลวิธีทำ EN -> TH
// ลำดับการหาคำแปล: ไฟล์ที่แปลไว้ล่วงหน้า (th-steps.json) -> แคช -> เรียก API สด (มี timeout)
// ตอนนี้ th-steps.json ครอบคลุม 100% ของทุกท่า จึงแสดงผลทันทีโดยไม่ต้องเรียก API
// ส่วนการเรียก API คงไว้เป็น fallback เผื่อ dataset เพิ่มประโยคใหม่ และมี timeout กันค้าง

const memCache = new Map();
const LS_KEY = "th-translations-v1";
const API_TIMEOUT_MS = 6000;

// โหลดไฟล์ pre-translated ครั้งเดียว (เก็บใน public/ -> เสิร์ฟที่ BASE_URL)
let bundledPromise = null;
function loadBundled() {
  if (!bundledPromise) {
    const url = `${import.meta.env.BASE_URL}th-steps.json`;
    bundledPromise = fetch(url)
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return bundledPromise;
}

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStore(store) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(store));
  } catch {
    // ข้ามได้
  }
}

// เรียก API แบบมี timeout — ถ้าช้า/ล้มเหลว/โควต้าหมด จะคืนข้อความอังกฤษเดิม (ไม่ค้าง)
async function translateViaApi(key) {
  const url =
    "https://api.mymemory.translated.net/get?q=" +
    encodeURIComponent(key) +
    "&langpair=en|th";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return key;
    const data = await res.json();
    const th = data?.responseData?.translatedText;
    if (!th) return key;
    memCache.set(key, th);
    const store = loadStore();
    store[key] = th;
    saveStore(store);
    return th;
  } catch {
    return key; // fallback: แสดงภาษาอังกฤษแทน ดีกว่าค้างหรือพัง
  } finally {
    clearTimeout(timer);
  }
}

async function translateOne(text, bundled) {
  const key = text.trim();
  if (bundled[key]) return bundled[key];
  if (memCache.has(key)) return memCache.get(key);

  const store = loadStore();
  if (store[key]) {
    memCache.set(key, store[key]);
    return store[key];
  }

  return translateViaApi(key);
}

// แปลหลายบรรทัด (steps) — คืน array ภาษาไทยเรียงตามเดิม (ไม่มีทาง reject)
export async function translateSteps(steps) {
  const bundled = await loadBundled();
  return Promise.all(steps.map((s) => translateOne(s, bundled)));
}
