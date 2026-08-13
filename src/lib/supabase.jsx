import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseUrl.startsWith("http")) {
    console.error("ГРЕШКА: VITE_SUPABASE_URL липсва или не започва с https://");
}

export const supabase = createClient(
    supabaseUrl && supabaseUrl.startsWith("http")
        ? supabaseUrl
        : "https://xyzcompany.supabase.co", // валиден dummy URL, за да не гърми инициализацията
    supabaseAnonKey || "dummy-key"
);