import supabase from '@/supabase';
import { clearQueryCache } from '@/lib/queryClient';

/** Signs the user out and wipes cached user data (in memory and in IndexedDB). */
export async function signOut(): Promise<void> {
  try {
    // 'local': only end this device's session, so signing out here doesn't log the user out everywhere
    await supabase.auth.signOut({ scope: 'local' });
  } finally {
    await clearQueryCache();
  }
}
