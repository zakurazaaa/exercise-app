// ข้อมูลฟอร์ม: "ออกแรงที่ไหน" + "ข้อผิดพลาดที่พบบ่อย" + จุดสิ้นสุดท่า
// รายท่า (EX_OVERRIDE) มาก่อน ถ้าไม่มีก็ใช้ระดับหมวด (PATTERN)
import { classify } from "./classify";
import { PATTERN, EX_OVERRIDE } from "./form-data";

// คืน { effort:[], mistakes:[], endPosition, grip } หรือ null ถ้าไม่มีข้อมูล
export function getForm(ex) {
  if (!ex) return null;
  const pat = PATTERN[classify(ex)];
  const ov = EX_OVERRIDE[ex.id];
  if (!pat && !ov) return null;

  const effort = ov?.effort?.length ? ov.effort : pat?.effort || [];
  const mistakes = ov?.mistakes?.length ? ov.mistakes : pat?.mistakes || [];
  if (!effort.length && !mistakes.length) return null;

  return {
    effort,
    mistakes,
    endPosition: ov?.endPosition || "",
    grip: pat?.grip || "", // คำอธิบายผลของ grip/มุม (ระดับหมวด)
  };
}
