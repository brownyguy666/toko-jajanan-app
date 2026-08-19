import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

const FALLBACK_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4ZWVneWlyZXFneHNodGF6a3poIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzA1ODI1NywiZXhwIjoyMTAyNjM0MjU3fQ.ZGD_619MwquegjFHfrNdxK7uBznTn0m0A_dSYnZZTlU";

export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://xxeegyireqgxshtazkzh.supabase.co";

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    FALLBACK_SERVICE_ROLE_KEY;

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
