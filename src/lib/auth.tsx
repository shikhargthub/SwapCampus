import {
  createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  college_id: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, profile: null,
  isAdmin: false, loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

async function fetchUserData(userId: string) {
  const fetchData = Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).single(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("fetchUserData timeout")), 1000)
  );

  const [{ data: profileData }, { data: rolesData }] = await Promise.race([
    fetchData,
    timeout,
  ]);

  return {
    profile: profileData as Profile | null,
    isAdmin: rolesData?.some((r: any) => r.role === "admin") ?? false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Keep last known good session — never wipe it on tab switch
  const lastGoodSession = useRef<Session | null>(null);

  const applySession = useCallback(async (s: Session | null) => {
    setSession(s);
    setUser(s?.user ?? null);
    if (s?.user) {
      lastGoodSession.current = s; // save it
      try {
        const { profile, isAdmin } = await fetchUserData(s.user.id);
        setProfile(profile);
        setIsAdmin(isAdmin);
      } catch (err) {
        console.error("fetchUserData failed:", err);

      }
    } else {
      setProfile(null);
      setIsAdmin(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { profile, isAdmin } = await fetchUserData(user.id);
    setProfile(profile);
    setIsAdmin(isAdmin);
  }, [user]);

  useEffect(() => {
    let mounted = true;

    // Wake DB + load session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      await applySession(session);
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        if (!mounted) return;
        if (event === "INITIAL_SESSION") return;

        // ✅ KEY FIX: if SIGNED_OUT fires but we have a valid saved session,
        // it's a false logout from tab switching — restore the session instead
        if (event === "SIGNED_OUT") {
          if (lastGoodSession.current) {
            // Verify token is actually still valid
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession && mounted) {
              // Token still valid — it was a false logout, ignore it
              setSession(currentSession);
              setUser(currentSession.user);
              if (mounted) setLoading(false);
              return;
            }
          }
          // Token truly expired — real logout
          lastGoodSession.current = null;
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          if (mounted) setLoading(false);
          return;
        }

        await applySession(s);
        if (mounted) setLoading(false);
      }
    );

    // On tab return — silently restore session without DB fetch
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          lastGoodSession.current = currentSession;
        } else if (!lastGoodSession.current) {
          setSession(null);
          setUser(null);
        }
        if (mounted) setLoading(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [applySession]);

  const signOut = useCallback(async () => {
    lastGoodSession.current = null; // clear saved session on real logout
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, isAdmin, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}