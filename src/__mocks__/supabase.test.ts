import { describe, it, expect } from 'vitest';
import supabaseMock from './supabase';

describe('supabase mock', () => {
    it('provides basic auth mock structure', () => {
        expect(supabaseMock.auth).toBeDefined();
        expect(typeof supabaseMock.auth.getSession).toBe('function');
    });

    it('provides fluent from() mock', () => {
        const query = (supabaseMock.from as any)('test').select('*').eq('id', 1);
        expect(query).toBeDefined();
        expect(typeof query.single).toBe('function');
    });

    it('provides storage mock', () => {
        const storage = (supabaseMock.storage.from as any)('test');
        expect(storage).toBeDefined();
        expect(storage.getPublicUrl('path')).toEqual({ data: { publicUrl: 'mock-url' } });
    });
});
