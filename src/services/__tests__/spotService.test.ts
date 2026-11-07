import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spotService } from '@/services/spotService';
import supabase from '@/supabase';

// Mock supabase
vi.mock('@/supabase', () => ({
    default: {
        from: vi.fn(),
        rpc: vi.fn(),
        functions: { invoke: vi.fn() },
    }
}));

describe('spotService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches flag count from content_reports table', async () => {
        const mockSpotId = 'spot-123';

        // Setup mocks for the various promises in fetchSpotDetails
        const mockFrom = vi.mocked(supabase.from);

        mockFrom.mockImplementation((table: string) => {
            if (table === 'spots') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    maybeSingle: vi.fn().mockResolvedValue({ data: { id: mockSpotId, name: 'Test' }, error: null })
                } as any;
            }
            if (table === 'content_reports') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    // Return a specific count for testing
                    then: (cb: any) => Promise.resolve(cb({ count: 5, data: [], error: null }))
                } as any;
            }
            // Default mock for other tables
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                then: (cb: any) => Promise.resolve(cb({ data: [], error: null }))
            } as any;
        });

        const result = await spotService.fetchSpotDetails(mockSpotId);

        expect(result?.flagCount).toBe(5);
        expect(mockFrom).toHaveBeenCalledWith('content_reports');
    });

    describe('deleteSpot', () => {
        const spotId = 'spot-123';
        const invoke = () => vi.mocked((supabase as any).functions.invoke);

        /** A supabase-js FunctionsHttpError: the failed Response lives on error.context. */
        const httpError = (status: number, body: unknown) => ({
            message: 'Edge Function returned a non-2xx status code',
            context: new Response(JSON.stringify(body), { status }),
        });

        it('delegates to the delete-spot edge function and touches nothing else on success', async () => {
            invoke().mockResolvedValue({ data: { ok: true }, error: null });

            await spotService.deleteSpot(spotId);

            expect(invoke()).toHaveBeenCalledWith('delete-spot', { body: { spotId } });
            expect(supabase.from).not.toHaveBeenCalled();
        });

        it('surfaces the server message when the function refuses (e.g. not the creator)', async () => {
            invoke().mockResolvedValue({ data: null, error: httpError(403, { error: 'Not allowed to delete this spot' }) });

            await expect(spotService.deleteSpot(spotId)).rejects.toThrow('Not allowed to delete this spot');
            expect(supabase.from).not.toHaveBeenCalled();
        });

        it('does NOT fall back when the 404 is "spot not found" (only when the function is missing)', async () => {
            invoke().mockResolvedValue({ data: null, error: httpError(404, { error: 'Spot not found' }) });

            await expect(spotService.deleteSpot(spotId)).rejects.toThrow('Spot not found');
            expect(supabase.from).not.toHaveBeenCalled();
        });

        describe('fallback when the edge function is not deployed', () => {
            const notDeployed = () => ({
                data: null,
                error: httpError(404, { code: 'NOT_FOUND', message: 'Requested function was not found' }),
            });

            const setup = (storageError: { message: string } | null = null) => {
                const remove = vi.fn().mockResolvedValue({ error: storageError });
                (supabase as any).storage = { from: vi.fn().mockReturnValue({ remove }) };
                const photoSelect = vi.fn().mockReturnThis();
                vi.mocked(supabase.from).mockImplementation((table: string) => {
                    if (table === 'spot_photos') {
                        return {
                            select: photoSelect,
                            eq: vi.fn().mockReturnThis(),
                            then: (cb: any) => Promise.resolve(cb({ data: [{
                                url: 'https://p.supabase.co/storage/v1/object/public/spot-media/spots/s/photos/originals/a.webp',
                                thumbnail_small_url: 'https://p.supabase.co/storage/v1/object/public/spot-media/spots/s/photos/thumbnails/small/a.webp',
                                thumbnail_large_url: 'https://p.supabase.co/storage/v1/object/public/spot-media/spots/s/photos/thumbnails/large/a.webp',
                                thumbnailurl: null,
                            }], error: null })),
                        } as any;
                    }
                    if (table === 'spot_videos') {
                        return {
                            select: vi.fn().mockReturnThis(),
                            eq: vi.fn().mockReturnThis(),
                            then: (cb: any) => Promise.resolve(cb({ data: [{
                                url: 'https://p.supabase.co/storage/v1/object/public/spot-media/spots/s/videos/originals/v.mp4',
                                thumbnail_url: 'https://p.supabase.co/storage/v1/object/public/spot-media/spots/s/videos/thumbnails/v.webp',
                            }], error: null })),
                        } as any;
                    }
                    return {
                        delete: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        select: vi.fn().mockReturnThis(),
                        then: (cb: any) => Promise.resolve(cb({ data: [{ id: spotId }], error: null })),
                    } as any;
                });
                return { remove, photoSelect };
            };

            it('removes every thumbnail layout, not just the original', async () => {
                invoke().mockResolvedValue(notDeployed());
                const { remove, photoSelect } = setup();

                await spotService.deleteSpot(spotId);

                // Regression: the old code selected only `url`, leaking both current-layout thumbnails
                expect(photoSelect).toHaveBeenCalledWith('url, thumbnail_small_url, thumbnail_large_url, thumbnailurl');
                expect(remove).toHaveBeenCalledWith([
                    'spots/s/photos/originals/a.webp',
                    'spots/s/photos/thumbnails/small/a.webp',
                    'spots/s/photos/thumbnails/large/a.webp',
                    'spots/s/videos/originals/v.mp4',
                    'spots/s/videos/thumbnails/v.webp',
                ]);
            });

            it('still deletes the spot if storage removal fails, but warns instead of failing silently', async () => {
                invoke().mockResolvedValue(notDeployed());
                setup({ message: 'not allowed' });
                const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

                await expect(spotService.deleteSpot(spotId)).resolves.toBeUndefined();

                expect(warn).toHaveBeenCalledWith(expect.stringContaining('could not be removed'), 'not allowed');
                warn.mockRestore();
            });
        });
    });

    it('toggles favorite status (delete)', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({ data: [{ new_is_favorited: false, new_favorite_count: 0 }], error: null } as any);

        await spotService.toggleFavorite('s1');
        expect(supabase.rpc).toHaveBeenCalledWith('toggle_spot_favorite', {
            p_spot_id: 's1'
        });
    });

    it('toggles favorite status (insert)', async () => {
        vi.mocked(supabase.rpc).mockResolvedValue({ data: [{ new_is_favorited: true, new_favorite_count: 1 }], error: null } as any);

        await spotService.toggleFavorite('s1');
        expect(supabase.rpc).toHaveBeenCalledWith('toggle_spot_favorite', {
            p_spot_id: 's1'
        });
    });

    it('adds a video link', async () => {
        const mockFrom = vi.mocked(supabase.from);
        mockFrom.mockReturnValue({
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'l1' }, error: null })
        } as any);

        const result = await spotService.addVideoLink('s1', 'u1', 'vid1', 0);
        expect(result.id).toBe('l1');
        expect(mockFrom).toHaveBeenCalledWith('spot_video_links');
    });

    it('updates a video link', async () => {
        const mockFrom = vi.mocked(supabase.from);
        mockFrom.mockReturnValue({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'l1' }, error: null })
        } as any);

        const result = await spotService.updateVideoLink('l1', 'vid1', 10);
        expect(result.id).toBe('l1');
        expect(mockFrom).toHaveBeenCalledWith('spot_video_links');
    });

    it('deletes a video link', async () => {
        const mockFrom = vi.mocked(supabase.from);
        mockFrom.mockReturnValue({
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: (cb: any) => Promise.resolve(cb({ error: null }))
        } as any);

        await spotService.deleteVideoLink('l1');
        expect(mockFrom).toHaveBeenCalledWith('spot_video_links');
    });

    it('fetches skater suggestions', async () => {
        const mockFrom = vi.mocked(supabase.from);
        mockFrom.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            not: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [{ skater_name: 'Tony' }, { skater_name: 'Tony' }], error: null })
        } as any);

        const result = await spotService.fetchSkaterSuggestions('Ton');
        expect(result).toEqual(['Tony']);
    });

    it('toggles video link like (delete)', async () => {
        const mockFrom = vi.mocked(supabase.from);
        mockFrom.mockReturnValue({
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: (cb: any) => Promise.resolve(cb({ error: null }))
        } as any);

        await spotService.toggleVideoLinkLike('l1', 'u1', true);
        expect(mockFrom).toHaveBeenCalledWith('spot_video_link_likes');
    });

    it('toggles video link like (upsert)', async () => {
        const mockFrom = vi.mocked(supabase.from);
        mockFrom.mockReturnValue({
            upsert: vi.fn().mockReturnThis(),
            then: (cb: any) => Promise.resolve(cb({ error: null }))
        } as any);

        await spotService.toggleVideoLinkLike('l1', 'u1', false);
        expect(mockFrom).toHaveBeenCalledWith('spot_video_link_likes');
    });
});
