// แปลวิธีทำ EN -> TH
// ลำดับการหาคำแปล: ไฟล์ที่แปลไว้ล่วงหน้า (th-steps.json) -> แคช -> เรียก API สด
// ทำให้ส่วนใหญ่แสดงผลทันที เหลือเฉพาะประโยคที่ยังไม่ได้ pre-translate ที่ต้องเรียก API

const memCache = new Map();
const LS_KEY = "th-translations-v1";

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

async function translateOne(text, bundled) {
  const key = text.trim();
  if (bundled[key]) return bundled[key];
  if (memCache.has(key)) return memCache.get(key);

  const store = loadStore();
  if (store[key]) {
    memCache.set(key, store[key]);
    return store[key];
  }

  const url =
    "https://api.mymemory.translated.net/get?q=" +
    encodeURIComponent(key) +
    "&langpair=en|th";
  const res = await fetch(url);
  if (!res.ok) throw new Error("translate failed");
  const data = await res.json();
  const th = data?.responseData?.translatedText;
  if (!th) throw new Error("no translation");

  memCache.set(key, th);
  store[key] = th;
  saveStore(store);
  return th;
}

// แปลหลายบรรทัด (steps) — คืน array ภาษาไทยเรียงตามเดิม
export async function translateSteps(steps) {
  const bundled = await loadBundled();
  return Promise.all(steps.map((s) => translateOne(s, bundled)));
}
