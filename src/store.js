// แหล่งข้อมูลผู้ใช้รวม: โปรแกรมฝึก + ที่ชอบ
// - เก็บใน localStorage เสมอ (ใช้งานได้แม้ไม่ล็อกอิน)
// - ถ้าล็อกอิน (user) จะ pull จาก Supabase ตอนเข้า และ push อัตโนมัติเมื่อแก้ไข
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, cloudEnabled } from "./supabase";

const LS_KEY = "userdata-v1";
const newId = () =>
  "p" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

function readLocal() {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY) || "null");
    if (v && Array.isArray(v.programs)) return v;
  } catch {
    /* ignore */
  }
  // migrate จาก key เดิม (programs-v1 / favorites-v1)
  let programs = [];
  let activeId = null;
  try {
    const p = JSON.parse(localStorage.getItem("programs-v1") || "null");
    if (p && Array.isArray(p.programs)) {
      programs = p.programs;
      activeId = p.activeId;
    }
  } catch {
    /* ignore */
  }
  let favorites = [];
  try {
    const f = JSON.parse(localStorage.getItem("favorites-v1") || "[]");
    if (Array.isArray(f)) favorites = f;
  } catch {
    /* ignore */
  }
  if (programs.length === 0) {
    const id = newId();
    programs = [{ id, name: "โปรแกรมของฉัน", ids: [] }];
    activeId = id;
  }
  return { programs, activeId, favorites, streak: { count: 0, lastDate: null } };
}

// วันที่แบบ local "YYYY-MM-DD"
const dayStr = (d) =>
  d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const todayStr = () => dayStr(new Date());
const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayStr(d);
};

export function useUserData(user) {
  const [state, setState] = useState(readLocal);
  const [syncing, setSyncing] = useState(false);
  const pushTimer = useRef(null);
  const skipNextPush = useRef(false);

  // persist local เสมอ
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  // ล็อกอิน -> pull จากคลาวด์ (ถ้ามี) ไม่งั้น push local ขึ้นไป
  useEffect(() => {
    if (!cloudEnabled || !user) return;
    let cancelled = false;
    setSyncing(true);
    supabase
      .from("user_data")
      .select("data")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.data?.programs) {
          skipNextPush.current = true; // อย่า push ทับทันทีหลังดึงมา
          setState(data.data);
        } else {
          pushNow(state); // ยังไม่มีบนคลาวด์ -> อัปโหลดของ local
        }
        setSyncing(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function pushNow(data) {
    if (!cloudEnabled || !user) return;
    supabase
      .from("user_data")
      .upsert({ user_id: user.id, data, updated_at: new Date().toISOString() })
      .then(() => {});
  }

  // push อัตโนมัติเมื่อ state เปลี่ยน (debounce) ขณะล็อกอิน
  useEffect(() => {
    if (!cloudEnabled || !user) return;
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => pushNow(state), 800);
    return () => clearTimeout(pushTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, user]);

  // ---------- favorites ----------
  const isFav = useCallback((id) => state.favorites.includes(id), [state.favorites]);
  const toggleFav = useCallback((id) => {
    setState((s) => ({
      ...s,
      favorites: s.favorites.includes(id)
        ? s.favorites.filter((x) => x !== id)
        : [...s.favorites, id],
    }));
  }, []);

  // ---------- programs ----------
  const { programs, activeId } = state;
  const active = programs.find((p) => p.id === activeId) || programs[0] || null;

  const setActive = useCallback((id) => setState((s) => ({ ...s, activeId: id })), []);
  const create = useCallback((name) => {
    const id = newId();
    setState((s) => ({ ...s, programs: [...s.programs, { id, name: name || "โปรแกรมใหม่", ids: [] }], activeId: id }));
    return id;
  }, []);
  const createWith = useCallback((name, exId) => {
    const id = newId();
    setState((s) => ({ ...s, programs: [...s.programs, { id, name: name || "โปรแกรมใหม่", ids: exId ? [exId] : [] }], activeId: id }));
    return id;
  }, []);
  const rename = useCallback((pid, name) => {
    setState((s) => ({ ...s, programs: s.programs.map((p) => (p.id === pid ? { ...p, name } : p)) }));
  }, []);
  const removeProgram = useCallback((pid) => {
    setState((s) => {
      const programs = s.programs.filter((p) => p.id !== pid);
      const activeId = s.activeId === pid ? programs[0]?.id || null : s.activeId;
      return { ...s, programs, activeId };
    });
  }, []);
  const toggleIn = useCallback((pid, exId) => {
    setState((s) => ({
      ...s,
      programs: s.programs.map((p) => {
        if (p.id !== pid) return p;
        const has = p.ids.includes(exId);
        return { ...p, ids: has ? p.ids.filter((x) => x !== exId) : [...p.ids, exId] };
      }),
    }));
  }, []);
  const removeFromActive = useCallback((exId) => {
    setState((s) => ({ ...s, programs: s.programs.map((p) => (p.id === s.activeId ? { ...p, ids: p.ids.filter((x) => x !== exId) } : p)) }));
  }, []);
  const move = useCallback((exId, dir) => {
    setState((s) => ({
      ...s,
      programs: s.programs.map((p) => {
        if (p.id !== s.activeId) return p;
        const i = p.ids.indexOf(exId);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= p.ids.length) return p;
        const ids = [...p.ids];
        [ids[i], ids[j]] = [ids[j], ids[i]];
        return { ...p, ids };
      }),
    }));
  }, []);
  const clearActive = useCallback(() => {
    setState((s) => ({ ...s, programs: s.programs.map((p) => (p.id === s.activeId ? { ...p, ids: [] } : p)) }));
  }, []);
  const isIn = useCallback((pid, exId) => programs.some((p) => p.id === pid && p.ids.includes(exId)), [programs]);
  const inAny = useCallback((exId) => programs.some((p) => p.ids.includes(exId)), [programs]);
  const inActive = useCallback((exId) => !!active && active.ids.includes(exId), [active]);

  // ---------- streak (ยืดต่อเนื่องกี่วัน) ----------
  const streakState = state.streak || { count: 0, lastDate: null };
  // บันทึกว่าทำ session ยืดวันนี้ — คืน { count, incremented, alreadyToday }
  function recordStretchSession() {
    const cur = state.streak || { count: 0, lastDate: null };
    const today = todayStr();
    const alreadyToday = cur.lastDate === today;
    let count;
    if (alreadyToday) count = cur.count || 1;
    else if (cur.lastDate === yesterdayStr()) count = (cur.count || 0) + 1;
    else count = 1;
    setState((s) => ({ ...s, streak: { count, lastDate: today } }));
    return { count, incremented: !alreadyToday, alreadyToday };
  }

  return {
    syncing,
    fav: { isFav, toggle: toggleFav, count: state.favorites.length },
    streak: { count: streakState.count || 0, lastDate: streakState.lastDate || null, record: recordStretchSession },
    programs: {
      programs, active, activeId, programCount: programs.length,
      setActive, create, createWith, rename, removeProgram,
      toggleIn, isIn, inAny, inActive, removeFromActive, move, clearActive,
    },
  };
}
