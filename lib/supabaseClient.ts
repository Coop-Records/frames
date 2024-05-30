import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabaseAdminKey = process.env.SUPABASE_ADMIN_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAdminKey);
