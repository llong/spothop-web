import supabase from '@/supabase';
import { clearQueryCache } from '@/lib/queryClient';

/** Signs the user out and wipes cached user data (in memory and in IndexedDB). */
export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } finally {
    await clearQueryCache();
  }
}
