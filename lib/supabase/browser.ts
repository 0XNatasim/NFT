"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client (anon key) used ONLY for Realtime broadcast /
 * presence channels in Deal Rooms. All data reads and writes go through the
 * participant-scoped API routes — RLS has no public policies, so this client
 * cannot read any table. Channel names embed a per-room capability token that
 * is only ever handed to authenticated participants.
 */
let client: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return client;
}
