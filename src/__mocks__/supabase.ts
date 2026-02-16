import { vi } from 'vitest';

export const supabase: any = {
    auth: {
        getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } },
        })),
        getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
    },
    from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
    })),
    storage: {
        from: vi.fn(() => ({
            upload: vi.fn(),
            getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'mock-url' } })),
        })),
    },
    rpc: vi.fn(),
};

export default supabase;
