// แปลข้อความ EN -> TH แบบ on-demand ผ่าน MyMemory (ฟรี ไม่ต้องใช้คีย์)
// แคชผลลัพธ์ทั้งในหน่วยความจำและ localStorage เพื่อไม่ให้แปลซ้ำและประหยัดโควต้า

const memCache = new Map();
const LS_KEY = "th-translations-v1";

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
    // localStorage เต็มหรือถูกปิด — ข้ามได้ ยังมี memCache อยู่
  }
}

async function translateOne(text) {
  if (memCache.has(text)) return memCache.get(text);

  const store = loadStore();
  if (store[text]) {
    memCache.set(text, store[text]);
    return store[text];
  }

  const url =
    "https://api.mymemory.translated.net/get?q=" +
    encodeURIComponent(text) +
    "&langpair=en|th";
  const res = await fetch(url);
  if (!res.ok) throw new Error("translate failed");
  const data = await res.json();
  const th = data?.responseData?.translatedText;
  if (!th) throw new Error("no translation");

  memCache.set(text, th);
  store[text] = th;
  saveStore(store);
  return th;
}

// แปลหลายบรรทัด (steps) พร้อมกัน — คืน array ภาษาไทยเรียงตามเดิม
export async function translateSteps(steps) {
  return Promise.all(steps.map((s) => translateOne(s)));
}
