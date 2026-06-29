// จัดการรายการท่าโปรด เก็บใน localStorage (เก็บเป็น id ของท่า)
import { useCallback, useEffect, useState } from "react";

const LS_KEY = "favorites-v1";

function read() {
  try {
    return new Set(JSON.parse(localStorage.getItem(LS_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

export function useFavorites() {
  const [favs, setFavs] = useState(read);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify([...favs]));
    } catch {
      // ข้ามได้ถ้า localStorage ใช้ไม่ได้
    }
  }, [favs]);

  const toggle = useCallback((id) => {
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const isFav = useCallback((id) => favs.has(id), [favs]);

  return { favs, toggle, isFav, count: favs.size };
}
