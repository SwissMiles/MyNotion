export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Auth (Clerk) is optional: without a key the app runs in local-only mode. */
export const clerkConfigured = Boolean(CLERK_PUBLISHABLE_KEY);

/** Cloud persistence (Supabase) needs both URL and anon key. */
export const cloudConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
