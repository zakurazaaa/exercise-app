// โปรแกรมฝึกของฉัน — ลิสต์ท่าแบบเรียงลำดับ เก็บใน localStorage (เก็บเป็น id)
import { useCallback, useEffect, useState } from "react";

const LS_KEY = "routine-v1";

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function useRoutine() {
  const [ids, setIds] = useState(read);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(ids));
    } catch {
      // ข้ามได้
    }
  }, [ids]);

  const inRoutine = useCallback((id) => ids.includes(id), [ids]);

  const toggle = useCallback((id) => {
    setIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const remove = useCallback((id) => {
    setIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const move = useCallback((id, dir) => {
    setIds((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  const clear = useCallback(() => setIds([]), []);

  return { ids, inRoutine, toggle, remove, move, clear, count: ids.length };
}
