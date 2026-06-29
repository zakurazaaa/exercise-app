// ระบบล็อกอินด้วย Supabase (magic link ทางอีเมล)
import { useEffect, useState } from "react";
import { supabase, cloudEnabled } from "./supabase";

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

  // ส่งลิงก์เข้าสู่ระบบไปที่อีเมล
  const signIn = async (email) => {
    if (!cloudEnabled) throw new Error("cloud disabled");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (cloudEnabled) await supabase.auth.signOut();
  };

  return { user, ready, signIn, signOut, cloudEnabled };
}
