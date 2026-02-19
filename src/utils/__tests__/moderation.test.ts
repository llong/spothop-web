import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkContent } from '../moderation';
import supabase from 'src/supabase';

vi.mock('src/supabase', () => ({
    default: {
        functions: {
            invoke: vi.fn(),
        },
    }
}));

describe('moderation utils', () => {
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns safe true when no issues detected', async () => {
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
            data: { status: 'success' },
            error: null
        } as any);

        const result = await checkContent(mockFile);
        expect(result.safe).toBe(true);
    });

    it('returns safe false when explicit nudity is detected', async () => {
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
            data: { 
                status: 'success',
                nudity: { raw: 0.9 }
            },
            error: null
        } as any);

        const result = await checkContent(mockFile);
        expect(result.safe).toBe(false);
        expect(result.reason).toBe('Nudity detected');
    });

    it('returns safe false when weapons are detected', async () => {
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
            data: { 
                status: 'success',
                weapon: 0.8
            },
            error: null
        } as any);

        const result = await checkContent(mockFile);
        expect(result.safe).toBe(false);
        expect(result.reason).toBe('Weapon detected');
    });

    it('returns safe false when gore is detected', async () => {
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
            data: { 
                status: 'success',
                gore: { prob: 0.7 }
            },
            error: null
        } as any);

        const result = await checkContent(mockFile);
        expect(result.safe).toBe(false);
        expect(result.reason).toBe('Extreme violence/gore detected');
    });

    it('fails open (safe true) when function invocation fails', async () => {
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
            data: null,
            error: new Error('Invocation failed')
        } as any);

        const result = await checkContent(mockFile);
        expect(result.safe).toBe(true);
    });
});
