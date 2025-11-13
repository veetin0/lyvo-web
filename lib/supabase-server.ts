import { createServerClient } from '@supabase/ssr';
import { cookies as nextCookies } from 'next/headers';

const resolvedCookies = await nextCookies();

const cookies = {
  get: (name: string) => resolvedCookies.get(name)?.value,
  set: () => {},
  delete: () => {},
};

export const supabaseServer = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { cookies }
);