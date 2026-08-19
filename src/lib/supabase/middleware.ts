import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database, Profile } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("your-project-id")) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Jika belum login
  if (!user) {
    if (pathname.startsWith("/admin") || pathname.startsWith("/kasir")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // 2. Jika user sudah login, ambil profil & role
  let userProfile: Profile | null = null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile) {
    userProfile = profile as Profile;
  }

  // Jika akun dinonaktifkan
  if (userProfile && !userProfile.status_aktif) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "deactivated");
    return NextResponse.redirect(url);
  }

  const role = userProfile?.role || "pegawai";

  // 3. Akses halaman /login saat sudah authenticated -> redirect ke dashboard/kasir
  if (pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = role === "owner" ? "/admin" : "/kasir";
    return NextResponse.redirect(url);
  }

  // 4. Akses root / -> redirect sesuai role
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = role === "owner" ? "/admin" : "/kasir";
    return NextResponse.redirect(url);
  }

  // 5. Proteksi route /admin/* -> HANYA untuk OWNER
  if (pathname.startsWith("/admin")) {
    if (role !== "owner") {
      const url = request.nextUrl.clone();
      url.pathname = "/kasir";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
