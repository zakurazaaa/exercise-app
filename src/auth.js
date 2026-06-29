// ระบบล็อกอินด้วย username + password ง่ายๆ (ไม่ต้องยืนยันอีเมล)
// เบื้องหลังแปลง username -> อีเมลซ่อน (ascii-safe) เพื่อใช้กับ Supabase
import { useEffect, useState } from "react";
import { supabase, cloudEnabled } from "./supabase";

// username -> อีเมลซ่อน (รองรับภาษาไทย/อักขระใดก็ได้ ด้วยการ hex-encode)
function toEmail(username) {
  const u = username.trim().toLowerCase();
  const hex = Array.from(new TextEncoder().encode(u))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return "u_" + hex + "@fitpedia.app";
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!cloudEnabled);

  useEffect(() => {
    if (!cloudEnabled) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // เข้าสู่ระบบ ถ้ายังไม่มีบัญชีจะสมัครให้อัตโนมัติ
  const signIn = async (username, password) => {
    if (!cloudEnabled) throw new Error("cloud disabled");
    if (!username.trim()) throw new Error("กรุณาใส่ชื่อผู้ใช้");
    if (password.length < 6) throw new Error("รหัสผ่านต้องยาวอย่างน้อย 6 ตัว");
    const email = toEmail(username);

    const res = await supabase.auth.signInWithPassword({ email, password });
    if (!res.error) return;

    // ล็อกอินไม่ผ่าน -> ลองสมัครใหม่
    const up = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username.trim() } },
    });
    if (up.error) {
      throw new Error(
        /registered|already/i.test(up.error.message)
          ? "รหัสผ่านไม่ถูกต้อง (ชื่อผู้ใช้นี้มีอยู่แล้ว)"
          : up.error.message
      );
    }
    if (!up.data.session) {
      throw new Error(
        "สร้างบัญชีแล้ว แต่ต้องปิด 'Confirm email' ใน Supabase ก่อนถึงจะเข้าได้"
      );
    }
  };

  const signOut = async () => {
    if (cloudEnabled) await supabase.auth.signOut();
  };

  const displayName = user?.user_metadata?.username || "ผู้ใช้";

  return { user, ready, signIn, signOut, cloudEnabled, displayName };
}
