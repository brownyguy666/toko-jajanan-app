"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Profile, UserRole } from "@/types/database";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  role: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // Synchronous 0ms initialization from localStorage cache
  const [profile, setProfile] = useState<Profile | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("toko_auth_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          return {
            id: parsed.id || "cached-id",
            email: parsed.email || "",
            nama: parsed.nama || (parsed.role === "owner" ? "Hidayatul Fitri" : "Kasir"),
            role: parsed.role || "owner",
            status_aktif: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn("Could not read auth cache:", err);
      }
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const supabase = createClient();
  const router = useRouter();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        const p = data as unknown as Profile;
        setProfile(p);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              "toko_auth_cache",
              JSON.stringify({
                id: p.id,
                email: p.email,
                nama: p.nama,
                role: p.role,
              })
            );
          } catch (e) {
            console.warn("Could not update auth cache:", e);
          }
        }
      }

    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const meta = session.user.user_metadata;
          const initialRole: UserRole =
            meta?.role || (session.user.email?.includes("fitri") ? "owner" : "pegawai");
          const initialNama =
            meta?.nama || (initialRole === "owner" ? "Hidayatul Fitri" : "Kasir");

          setProfile((prev) => prev || {
            id: session.user.id,
            email: session.user.email || "",
            nama: initialNama,
            role: initialRole,
            status_aktif: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          // Fetch fresh from database in background
          fetchProfile(session.user.id);
        } else {
          // If explicitly no session
          if (typeof window !== "undefined" && !localStorage.getItem("toko_auth_cache")) {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const meta = newSession.user.user_metadata;
        const initialRole: UserRole =
          meta?.role || (newSession.user.email?.includes("fitri") ? "owner" : "pegawai");
        const initialNama =
          meta?.nama || (initialRole === "owner" ? "Hidayatul Fitri" : "Kasir");

        setProfile((prev) => prev || {
          id: newSession.user.id,
          email: newSession.user.email || "",
          nama: initialNama,
          role: initialRole,
          status_aktif: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        fetchProfile(newSession.user.id);
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("toko_auth_cache");
        }
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("toko_auth_cache");
      }
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const role: UserRole | null =
    profile?.role || (user?.user_metadata?.role as UserRole) || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
