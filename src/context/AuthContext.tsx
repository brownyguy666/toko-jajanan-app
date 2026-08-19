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
  const [profile, setProfile] = useState<Profile | null>(null);
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
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Instant sync: Set profile immediately from user_metadata to avoid any delay / layout shift
          const meta = session.user.user_metadata;
          const initialRole: UserRole =
            meta?.role || (session.user.email?.includes("fitri") ? "owner" : "pegawai");
          const initialNama =
            meta?.nama || (initialRole === "owner" ? "Hidayatul Fitri" : "Kasir");

          setProfile({
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
          setProfile(null);
        }
      } catch (err) {
        console.error("Error initializing auth:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
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
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

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
