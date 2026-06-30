// ข้อมูล/คำแนะนำท่ายืดกล้ามเนื้อ — อิงหลักฐาน:
// ACSM 2011 (ยืดมัดหลัก ≥2–3 วัน/สัปดาห์, ทุกวันยิ่งดี), Delphi consensus 2025
// (2–3 เซ็ต ค้าง 30–120 วิ/มัด), meta-analyses 2024 (static ค้างสั้น <60 วิ แทบไม่ลดแรง,
// ไม่ทำให้วิ่ง/กระโดด/ขว้างแย่; dynamic เหมาะอุ่นเครื่อง)

export function isStretch(ex) {
  return /stretch|mobility/.test((ex.name || "").toLowerCase());
}

// แยกชนิด: dynamic (เคลื่อนไหว) / pnf (มีคนช่วย) / static (ค้าง)
export function stretchType(ex) {
  const n = (ex.name || "").toLowerCase();
  if (/dynamic|swing|circle|walkout|inchworm|leg swing|arm circle/.test(n)) return "dynamic";
  if (/assisted/.test(n)) return "pnf";
  return "static";
}

const DOSE = {
  static: {
    typeLabel: "ยืดค้าง (Static)",
    timing: "cooldown",
    hold: "ค้าง 15–30 วินาที/ครั้ง",
    sets: "2–3 รอบ ต่อข้าง",
    holdSeconds: 30,
  },
  dynamic: {
    typeLabel: "ยืดแบบเคลื่อนไหว (Dynamic)",
    timing: "warmup",
    hold: "10–15 ครั้ง (ไม่ค้าง) ทำช้าๆ เพิ่มช่วงทีละนิด",
    sets: "1–2 รอบ",
    holdSeconds: 0,
  },
  pnf: {
    typeLabel: "ยืดแบบมีคนช่วย / PNF",
    timing: "cooldown",
    hold: "เกร็งค้าง ~6 วิ → ผ่อน แล้วยืดลึกขึ้น 20–30 วิ",
    sets: "2–3 รอบ ต่อข้าง",
    holdSeconds: 30,
  },
};

const TIMING = {
  warmup: { label: "เหมาะเป็นอุ่นเครื่อง (ก่อนออกกำลัง)", emoji: "🔥" },
  cooldown: { label: "เหมาะตอนคูลดาวน์ / เพิ่มความยืดหยุ่น", emoji: "🧊" },
};

const COMMON_CUES = [
  "🫁 หายใจเข้าลึก แล้วผ่อนลมออกช้าๆ ขณะยืด — อย่ากลั้นหายใจ",
  "🎯 ยืดจนรู้สึก “ตึงสบาย” ไม่ถึงจุดเจ็บ",
  "🚫 ห้ามเด้ง/กระตุก ทำช้าๆ นิ่งๆ และอุ่นเครื่องก่อนถ้าตัวยังเย็น",
  "↔️ ทำทั้งสองข้างให้เท่ากัน",
];

// คืนข้อมูลคำแนะนำการยืด หรือ null ถ้าไม่ใช่ท่ายืด
export function getStretch(ex) {
  if (!isStretch(ex)) return null;
  const type = stretchType(ex);
  const d = DOSE[type];
  const t = TIMING[d.timing];
  const cues = [...COMMON_CUES];
  if (type === "pnf") cues.push("⚠️ PNF ควรมีคู่ช่วยหรือทำอย่างระวัง อย่าฝืนแรงต้าน");
  if (d.timing === "cooldown")
    cues.push("⏱️ ถ้ายืดก่อนเล่นเวทหนัก ให้ค้างสั้นๆ (<60 วิ) จะไม่ลดแรง");
  return {
    type,
    typeLabel: d.typeLabel,
    timing: d.timing,
    timingLabel: t.label,
    timingEmoji: t.emoji,
    hold: d.hold,
    sets: d.sets,
    holdSeconds: d.holdSeconds,
    cues,
  };
}
