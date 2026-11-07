import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export default createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
);
