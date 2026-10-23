// supabase.js
// Se fija la versión MAYOR (@2) para que una futura v3 con cambios incompatibles
// no rompa la app de un día para otro. El service worker (sw.js) guarda esta
// librería en caché, así que tras la primera visita también carga sin conexión.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const supabase = createClient(
  "https://manobzroedsaxagugcvn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hbm9ienJvZWRzYXhhZ3VnY3ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzA5MTMsImV4cCI6MjA4MzY0NjkxM30.J9XxR_culoezre_7R3eM0xKt02F-0TW2tgmIWG4hQT8",
  {
    // La app no usa Supabase Auth (el acceso de admin/mesa va por PIN), así que no
    // hace falta guardar sesión ni refrescar tokens en segundo plano.
    // Si algún día se pasa a Supabase Auth, hay que quitar este bloque.
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);
