/**
 * supabase.ts — Supabase Admin client for the backend.
 *
 * Uses the SERVICE ROLE key — this bypasses RLS and is safe ONLY in a
 * server-side context (never send this key to the frontend).
 *
 * Usage:
 *   import { supabaseAdmin } from '../utils/supabase';
 *   const channel = supabaseAdmin.channel('driver-locations');
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn(
        '⚠ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. ' +
        'Supabase Realtime broadcasts will be unavailable.'
    );
}

// Service-role client — server-side only, bypasses RLS
export const supabaseAdmin = createClient(
    supabaseUrl ?? '',
    supabaseServiceKey ?? '',
    {
        auth: {
            // Service role clients do not need session persistence
            persistSession: false,
            autoRefreshToken: false,
        },
    }
);
