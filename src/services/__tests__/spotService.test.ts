import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spotService } from '../spotService';
import supabase from 'src/supabase';

// Mock supabase
vi.mock('src/supabase', () => ({
    default: {
        from: vi.fn(),
        rpc: vi.fn(),
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

    it('deletes a spot and its media', async () => {
        const mockSpotId = 'spot-123';
        const mockPhotos = [{ url: 'http://example.com/photo.jpg' }];
        const mockVideos = [{ url: 'http://example.com/video.mp4', thumbnail_url: 'http://example.com/thumb.jpg' }];

        const mockFrom = vi.mocked(supabase.from);
        const mockStorage = {
            from: vi.fn().mockReturnThis(),
            remove: vi.fn().mockResolvedValue({ error: null })
        };
        (supabase as any).storage = mockStorage;

        mockFrom.mockImplementation((table: string) => {
            if (table === 'spot_photos') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    mockResolvedValue: vi.fn().mockResolvedValue({ data: mockPhotos, error: null }),
                    then: (cb: any) => Promise.resolve(cb({ data: mockPhotos, error: null }))
                } as any;
            }
            if (table === 'spot_videos') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    then: (cb: any) => Promise.resolve(cb({ data: mockVideos, error: null }))
                } as any;
            }
            if (table === 'spots') {
                return {
                    delete: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    select: vi.fn().mockReturnThis(),
                    then: (cb: any) => Promise.resolve(cb({ data: [{ id: mockSpotId }], error: null }))
                } as any;
            }
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                then: (cb: any) => Promise.resolve(cb({ data: [], error: null }))
            } as any;
        });

        await spotService.deleteSpot(mockSpotId);

        expect(mockFrom).toHaveBeenCalledWith('spots');
        expect(mockStorage.from).toHaveBeenCalledWith('spot-media');
        expect(mockStorage.remove).toHaveBeenCalled();
    });

    it('toggles favorite status (delete)', async () => {
        const mockFrom = vi.mocked(supabase.from);
        mockFrom.mockReturnValue({
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: (cb: any) => Promise.resolve(cb({ error: null }))
        } as any);

        await spotService.toggleFavorite('s1', 'u1', true);
        expect(mockFrom).toHaveBeenCalledWith('user_favorite_spots');
    });

    it('toggles favorite status (insert)', async () => {
        const mockFrom = vi.mocked(supabase.from);
        mockFrom.mockReturnValue({
            upsert: vi.fn().mockReturnThis(),
            then: (cb: any) => Promise.resolve(cb({ error: null }))
        } as any);

        await spotService.toggleFavorite('s1', 'u1', false);
        expect(mockFrom).toHaveBeenCalledWith('user_favorite_spots');
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
