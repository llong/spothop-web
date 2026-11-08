import { renderHook } from '@testing-library/react';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import supabase from '@/supabase';
import { optimizePhoto } from '@/utils/imageOptimization';
import { checkContent } from '@/utils/moderation';

// Mock dependencies
vi.mock('@/utils/moderation', () => ({
    checkContent: vi.fn().mockResolvedValue({ safe: true }),
}));

vi.mock('@/supabase', () => ({
    default: {
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn().mockResolvedValue({ error: null }),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'http://mock.url' } })),
            })),
        },
        from: vi.fn(() => ({
            insert: vi.fn().mockResolvedValue({ error: null }),
        })),
    },
}));

const { thumbnailLarge } = vi.hoisted(() => ({ thumbnailLarge: { blob: new Blob(['large']) } }));
vi.mock('@/utils/imageOptimization', () => ({
    optimizePhoto: vi.fn().mockResolvedValue({
        original: { blob: new Blob(['original']) },
        thumbnailSmall: { blob: new Blob(['small']) },
        thumbnailLarge,
    }),
    generateImageFilename: vi.fn().mockReturnValue('test-image.jpg'),
}));

describe('useMediaUpload hook', () => {
    const mockUser = { user: { id: 'test-user-id' } };
    const mockSetStatusMessage = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('uploads photos correctly', async () => {
        const { result } = renderHook(() => useMediaUpload({
            user: mockUser,
            setStatusMessage: mockSetStatusMessage
        }));

        const mockFile = new File([], 'test.jpg');

        await result.current.uploadMedia('spot123', [mockFile], []);

        expect(optimizePhoto).toHaveBeenCalledWith(mockFile);
        expect(supabase.storage.from).toHaveBeenCalledWith('spot-media');
        expect(supabase.from).toHaveBeenCalledWith('spot_photos');
        expect(mockSetStatusMessage).toHaveBeenLastCalledWith('Uploading photos (1/1)...');
    });

    it('scans the small 800px version of a photo, not the full-size original', async () => {
        const { result } = renderHook(() => useMediaUpload({ user: mockUser, setStatusMessage: mockSetStatusMessage }));
        const mockFile = new File(['huge original'], 'test.jpg');

        await result.current.uploadMedia('spot123', [mockFile], []);

        expect(checkContent).toHaveBeenCalledTimes(1);
        expect(checkContent).toHaveBeenCalledWith(thumbnailLarge.blob);
    });

    it('rejects the upload when the scan flags a photo', async () => {
        vi.mocked(checkContent).mockResolvedValueOnce({ safe: false, reason: 'Nudity detected' });
        const { result } = renderHook(() => useMediaUpload({ user: mockUser, setStatusMessage: mockSetStatusMessage }));

        await expect(result.current.uploadMedia('spot123', [new File([], 'a.jpg')], []))
            .rejects.toThrow('Upload rejected: Nudity detected');
        expect(supabase.from).not.toHaveBeenCalledWith('spot_photos');
    });

    it('uploads videos correctly', async () => {
        const { result } = renderHook(() => useMediaUpload({
            user: mockUser,
            setStatusMessage: mockSetStatusMessage
        }));

        const mockVideoFile = new File([], 'test.mp4', { type: 'video/mp4' });
        const mockVideoAsset = { id: 'v1', file: mockVideoFile, thumbnail: new File(['t'], 'thumb.webp', { type: 'image/webp' }) };

        await result.current.uploadMedia('spot123', [], [mockVideoAsset as any]);

        expect(supabase.storage.from).toHaveBeenCalledWith('spot-media');
        expect(supabase.from).toHaveBeenCalledWith('spot_videos');
        expect(mockSetStatusMessage).toHaveBeenCalledWith('Uploading video 1/1...');
        // the video file itself can't be scanned; its thumbnail frame is
        expect(checkContent).toHaveBeenCalledWith(mockVideoAsset.thumbnail);
    });

    it('fails the upload (instead of saving an empty thumbnail) when the video thumbnail upload is rejected', async () => {
        // Regression: a rejected thumbnail used to be ignored and saved as thumbnail_url = ''
        const upload = vi.fn()
            .mockResolvedValueOnce({ error: null })
            .mockResolvedValueOnce({ error: { message: 'mime type image/jpeg is not supported' } });
        vi.mocked(supabase.storage.from).mockImplementation(() => ({ upload, getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'http://mock.url' } })) }) as any);
        const { result } = renderHook(() => useMediaUpload({ user: mockUser, setStatusMessage: mockSetStatusMessage }));
        const asset = { id: 'v1', file: new File([], 'v.mp4', { type: 'video/mp4' }), thumbnail: new File([], 't.webp', { type: 'image/webp' }) };

        await expect(result.current.uploadMedia('spot123', [], [asset]))
            .rejects.toThrow('Error uploading video thumbnail: mime type image/jpeg is not supported');
        expect(supabase.from).not.toHaveBeenCalledWith('spot_videos');
    });

    it('does not insert a photo row when one of its uploads fails', async () => {
        // supabase-js returns { error } instead of throwing; the old code ignored it and still inserted a row
        vi.mocked(supabase.storage.from).mockImplementationOnce(() => ({
            upload: vi.fn().mockResolvedValue({ error: { message: 'bucket full' } }),
            getPublicUrl: vi.fn(),
        }) as any);
        const { result } = renderHook(() => useMediaUpload({ user: mockUser, setStatusMessage: mockSetStatusMessage }));

        await expect(result.current.uploadMedia('spot123', [new File([], 'test.jpg')], []))
            .rejects.toThrow('Error uploading photo: bucket full');

        expect(supabase.from).not.toHaveBeenCalledWith('spot_photos');
    });

    it('throws error if user is not authenticated', async () => {
        const { result } = renderHook(() => useMediaUpload({
            user: null,
            setStatusMessage: mockSetStatusMessage
        }));

        await expect(result.current.uploadMedia('spot123', [], []))
            .rejects.toThrow('User not authenticated');
    });
});
