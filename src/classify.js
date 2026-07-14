// จัดประเภทท่าตาม "รูปแบบการเคลื่อนไหว" — ใช้ร่วมกันทั้ง setup.js / form.js / muscle-fix.js
// ลำดับสำคัญ (บนสุดถูกเช็กก่อน) — ท่าที่ชื่อมี "row" ต้องเช็ก upright/rear-delt ก่อน row ทั่วไป
export function classify(ex) {
  const n = (ex.name || "").toLowerCase();
  const t = (ex.target || "").toLowerCase();
  const bp = (ex.body_part || "").toLowerCase();

  if (/calf|heel raise|toe raise/.test(n)) return "calf";
  if (/leg extension/.test(n)) return "legext";
  if (/leg curl/.test(n)) return "legcurl";
  if (/leg press|hack squat|leg wide press|lying squat/.test(n)) return "legpress";
  if (/squat|lunge|split squat|sprint/.test(n)) return "squat";
  if (/deadlift|good morning|romanian|\brdl\b|pull through|hip hinge|\bswing\b/.test(n)) return "hinge";
  if (/abduction|adduction|hip abductor|hip adductor/.test(n)) return "hipabd";
  if (/back extension|hyperextension|hip extension/.test(n)) return "backext";
  if (/hip thrust|glute bridge/.test(n)) return "hipthrust";
  if (/assisted/.test(n) && /pull-up|chin-up|pull up|chin up|dip/.test(n)) return "assisted";
  if (/upright row/.test(n)) return "uprightrow";
  if (/rear delt|rear lateral|rear fly|revers|reverse fly/.test(n)) return "reardelt";
  if (/pec deck|pec-deck|butterfly|\bfly\b|flye/.test(n)) return "fly";
  if (/lat pulldown|pulldown|pull-down|pull down/.test(n)) return "latpulldown";
  if (/pullover/.test(n)) return "pullover";
  if (/pull-up|pull up|chin-up|chin up/.test(n)) return "latpulldown"; // ดึงแนวดิ่ง = แพทเทิร์นเดียวกับ pulldown
  if (/\brow\b/.test(n)) return "row";
  if (/shoulder press|overhead press|military|arnold|behind neck press|behind the neck/.test(n)) return "ohp";
  if (/internal rotation|external rotation|rotator|rotational/.test(n)) return "rotation";
  if (/lateral raise|side raise|front raise|forward raise|shoulder raise/.test(n)) return "sideraise";
  if (/wrist|forearm/.test(n) || t === "forearms") return "forearm";
  if (/shrug/.test(n) || t === "traps") return "shrug";
  if ((/curl/.test(n) && !/leg|wrist/.test(n)) || t === "biceps") return "bicep";
  if (/tricep|pushdown|push-down|kickback|skull|extension|dip/.test(n) || t === "triceps") return "tricep";
  if (/crunch|abdominal|\bab\b|ab coaster|sit-up|situp/.test(n) || ["abs", "obliques"].includes(t) || bp === "waist")
    return "abs";
  if (/chest press|bench press|incline press|decline press|chest/.test(n) || t === "pectorals")
    return "chestpress";
  return "generic";
}
