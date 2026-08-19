"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RootPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (role === "owner") {
        router.replace("/admin");
      } else {
        router.replace("/kasir");
      }
    }
  }, [user, role, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#efe6e6]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#d62934] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#81181f] tracking-wide">
          Memuat Toko Jajanan...
        </p>
      </div>
    </div>
  );
}
