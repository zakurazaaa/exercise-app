// โปรแกรมฝึกหลายชุด ตั้งชื่อเองได้ เก็บใน localStorage
// โครงสร้าง: { programs: [{id, name, ids:[]}], activeId }
import { useCallback, useEffect, useState } from "react";

const LS_KEY = "programs-v1";
const OLD_KEY = "routine-v1"; // ของเดิม (โปรแกรมเดียว) ไว้ migrate

const newId = () =>
  "p" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY) || "null");
    if (v && Array.isArray(v.programs)) return v;
  } catch {
    /* ignore */
  }
  // migrate จากของเดิม (ถ้ามี)
  let old = [];
  try {
    const o = JSON.parse(localStorage.getItem(OLD_KEY) || "[]");
    if (Array.isArray(o)) old = o;
  } catch {
    /* ignore */
  }
  const id = newId();
  return { programs: [{ id, name: "โปรแกรมของฉัน", ids: old }], activeId: id };
}

export function usePrograms() {
  const [state, setState] = useState(read);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const { programs, activeId } = state;
  const active = programs.find((p) => p.id === activeId) || programs[0] || null;

  const setActive = useCallback((id) => setState((s) => ({ ...s, activeId: id })), []);

  const create = useCallback((name) => {
    const id = newId();
    setState((s) => ({
      programs: [...s.programs, { id, name: name || "โปรแกรมใหม่", ids: [] }],
      activeId: id,
    }));
    return id;
  }, []);

  const rename = useCallback((pid, name) => {
    setState((s) => ({
      ...s,
      programs: s.programs.map((p) => (p.id === pid ? { ...p, name } : p)),
    }));
  }, []);

  const removeProgram = useCallback((pid) => {
    setState((s) => {
      const programs = s.programs.filter((p) => p.id !== pid);
      const activeId = s.activeId === pid ? programs[0]?.id || null : s.activeId;
      return { programs, activeId };
    });
  }, []);

  // เพิ่ม/เอาออก ในโปรแกรมที่กำลังเลือก (ถ้ายังไม่มีโปรแกรม ให้สร้างให้)
  const toggle = useCallback((exId) => {
    setState((s) => {
      let { programs, activeId } = s;
      if (!programs.some((p) => p.id === activeId)) {
        const id = newId();
        programs = [...programs, { id, name: "โปรแกรมของฉัน", ids: [] }];
        activeId = id;
      }
      programs = programs.map((p) => {
        if (p.id !== activeId) return p;
        const has = p.ids.includes(exId);
        return { ...p, ids: has ? p.ids.filter((x) => x !== exId) : [...p.ids, exId] };
      });
      return { programs, activeId };
    });
  }, []);

  const removeFromActive = useCallback((exId) => {
    setState((s) => ({
      ...s,
      programs: s.programs.map((p) =>
        p.id === s.activeId ? { ...p, ids: p.ids.filter((x) => x !== exId) } : p
      ),
    }));
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
    setState((s) => ({
      ...s,
      programs: s.programs.map((p) => (p.id === s.activeId ? { ...p, ids: [] } : p)),
    }));
  }, []);

  const inActive = useCallback(
    (exId) => !!active && active.ids.includes(exId),
    [active]
  );

  return {
    programs,
    active,
    activeId,
    programCount: programs.length,
    setActive,
    create,
    rename,
    removeProgram,
    toggle,
    removeFromActive,
    move,
    clearActive,
    inActive,
  };
}
