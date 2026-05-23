import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔑  PASTE YOUR SUPABASE CREDENTIALS HERE
// Go to: https://supabase.com/dashboard → your project → Settings → API
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
// ─────────────────────────────────────────────────────────────────────────────

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "⚠️  Supabase credentials missing. Create a .env file with:\n" +
    "  VITE_SUPABASE_URL=https://<project-id>.supabase.co\n" +
    "  VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>"
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: { "x-client-info": "swapcampus/1.0.0" },
  },
});
