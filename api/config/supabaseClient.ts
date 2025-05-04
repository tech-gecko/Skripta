import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env["SUPABASE_URL"];
const supabaseServiceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

if (!supabaseUrl) {
  throw new Error("Missing environment variable: SUPABASE_URL");
}
if (!supabaseServiceRoleKey) {
  throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
}

// We use the service_role key here for backend operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // We are using Firebase Auth on the frontend, so for backend operations
    // initiated by the server itself (like using the service_role key),
    // we typically don't need Supabase's auth persistence.
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

export default supabase;
console.log("[Supabase Client] Initialized successfully.");
