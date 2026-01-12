// supabase.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ⚠️ PON AQUÍ TUS DATOS
const SUPABASE_URL = "https://manobzroedsaxagugcvn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hbm9ienJvZWRzYXhhZ3VnY3ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzA5MTMsImV4cCI6MjA4MzY0NjkxM30.J9XxR_culoezre_7R3eM0xKt02F-0TW2tgmIWG4hQT8";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
