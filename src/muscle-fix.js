// แก้ข้อมูลกล้ามเนื้อให้ถูกต้อง (source เดิมมั่ว เช่น row → biceps)
// รายท่า (EX_OVERRIDE) มาก่อน, ระดับหมวด (MUSCLE) รอง, สุดท้าย fallback ค่าเดิม
import { classify } from "./classify";
import { MUSCLE, EX_OVERRIDE } from "./form-data";

const norm = (s) => (s || "").toLowerCase().trim();

// คืน { primary:[], secondary:[] } (คีย์กล้ามเนื้อตรงกับ muscle.js / target vocab)
export function getMuscles(ex, remoteSecondary = []) {
  const ov = EX_OVERRIDE[ex?.id];
  const pat = MUSCLE[classify(ex)];

  let primary, secondary;
  if (ov?.primary?.length) {
    primary = ov.primary;
    secondary = ov.secondary || [];
  } else if (pat?.primary?.length) {
    primary = pat.primary;
    secondary = pat.secondary || [];
  } else {
    // ไม่มีข้อมูล verified → ใช้ target เดิม + secondary จาก remote
    primary = ex?.target ? [ex.target] : [];
    secondary = remoteSecondary || [];
  }

  // ไม่ให้ secondary ซ้ำกับ primary + ตัดค่าซ้ำ
  const pset = new Set(primary.map(norm));
  const seen = new Set();
  const cleanSec = [];
  for (const m of secondary) {
    const key = norm(m);
    if (!pset.has(key) && !seen.has(key)) {
      seen.add(key);
      cleanSec.push(m);
    }
  }
  return { primary, secondary: cleanSec };
}
