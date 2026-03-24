/**
 * supabase.ts — Supabase client for the Expo frontend.
 *
 * Uses the ANON (public) key — this is safe to include in client code.
 * The anon key is subject to Row Level Security (RLS) policies.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO SUBSCRIBE TO DRIVER LOCATION UPDATES (Realtime):
 *
 * import { supabase } from '@/utils/supabase';
 *
 * useEffect(() => {
 *   const channel = supabase
 *     .channel('driver-locations')
 *     .on('postgres_changes', {
 *       event: 'UPDATE',
 *       schema: 'public',
 *       table: 'User',
 *       filter: 'role=eq.driver',   // only driver rows
 *     }, (payload) => {
 *       const { id, lastKnownLat, lastKnownLng } = payload.new;
 *       updateDriverMarker(id, lastKnownLat, lastKnownLng);
 *     })
 *     .subscribe();
 *
 *   return () => { supabase.removeChannel(channel); };
 * }, []);
 *
 * IMPORTANT: Enable Realtime on the `User` table in your Supabase project:
 *   Supabase Dashboard → Database → Replication → select `User` table
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        '[Supabase] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
        'Realtime location tracking will be unavailable.'
    );
}

export const supabase = createClient(
    supabaseUrl ?? '',
    supabaseAnonKey ?? ''
);
