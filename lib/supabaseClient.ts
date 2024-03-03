import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;

export const supabase = createClient(
  "https://vvtmhmiqctjaoiciiqms.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dG1obWlxY3RqYW9pY2lpcW1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwOTMxOTE0NSwiZXhwIjoyMDI0ODk1MTQ1fQ.6vQ3pIMDPzscqiLPc4TP3hZuzb3TzQUmPP4v638kb3E"
);
