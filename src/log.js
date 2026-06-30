// บันทึกการเล่น (workout log) — เก็บใน Supabase table 'workout_sets' (1 แถว = 1 เซ็ต)
import { supabase, cloudEnabled } from "./supabase";

const LB_PER_KG = 2.2046226218;
export const toLb = (kg) => kg * LB_PER_KG;
export const toKg = (lb) => lb / LB_PER_KG;
export function convertWeight(w, from, to) {
  if (w == null || from === to) return w;
  return from === "kg" ? toLb(w) : toKg(w);
}
export const stepFor = (unit) => (unit === "lb" ? 5 : 2.5);

// วันที่ท้องถิ่น YYYY-MM-DD
export function todayISO() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// ---------- สูตรคำนวณ (pure) ----------
// ประเมิน 1RM (Epley) — เหมาะกับเร็ปสูง; คืน 0 ถ้าข้อมูลไม่พอ
export function epley1RM(weight, reps) {
  if (!weight || !reps) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}
// ปริมาตรของเซ็ตเดียว = น้ำหนัก × เร็ป
export const setVolume = (s) => (s.weight || 0) * (s.reps || 0);
// ปริมาตรรวมของลิสต์เซ็ต
export const totalVolume = (sets) => sets.reduce((a, s) => a + setVolume(s), 0);

// หา PR จากลิสต์เซ็ตทั้งหมด (น้ำหนักหนักสุด, 1RM ประเมินสูงสุด)
export function computePR(sets) {
  let maxWeight = 0, maxE1RM = 0;
  for (const s of sets) {
    if ((s.weight || 0) > maxWeight) maxWeight = s.weight || 0;
    const e = epley1RM(s.weight, s.reps);
    if (e > maxE1RM) maxE1RM = e;
  }
  return { maxWeight, maxE1RM };
}

// จัดเซ็ตเป็น session ตามวันที่ (ใหม่ -> เก่า)
export function groupByDate(sets) {
  const map = new Map();
  for (const s of sets) {
    if (!map.has(s.date)) map.set(s.date, []);
    map.get(s.date).push(s);
  }
  const out = [...map.entries()].map(([date, list]) => ({
    date,
    sets: list.sort((a, b) => a.set_index - b.set_index),
    volume: totalVolume(list),
    best1RM: computePR(list).maxE1RM,
  }));
  out.sort((a, b) => (a.date < b.date ? 1 : -1));
  return out;
}

// ---------- Supabase CRUD ----------
export async function fetchLog(userId, exerciseId) {
  if (!cloudEnabled || !userId) return [];
  const { data, error } = await supabase
    .from("workout_sets")
    .select("*")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .order("date", { ascending: false })
    .order("set_index", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addSet(userId, row) {
  if (!cloudEnabled || !userId) throw new Error("ต้องล็อกอินก่อน");
  const { data, error } = await supabase
    .from("workout_sets")
    .insert({ ...row, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSet(id, patch) {
  const { data, error } = await supabase.from("workout_sets").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSet(id) {
  const { error } = await supabase.from("workout_sets").delete().eq("id", id);
  if (error) throw error;
}
