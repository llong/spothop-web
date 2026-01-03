import { renderHook } from '@testing-library/react';
import { useMediaUpload } from '../useMediaUpload';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import supabase from 'src/supabase';
import { optimizePhoto } from 'src/utils/imageOptimization';

// Mock dependencies
vi.mock('src/supabase', () => ({
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

vi.mock('src/utils/imageOptimization', () => ({
    optimizePhoto: vi.fn().mockResolvedValue({
        original: { blob: new Blob() },
        thumbnailSmall: { blob: new Blob() },
        thumbnailLarge: { blob: new Blob() },
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
        expect(mockSetStatusMessage).toHaveBeenCalledWith(expect.stringContaining('Optimizing and uploading 1 photos'));
    });

    it('uploads videos correctly', async () => {
        const { result } = renderHook(() => useMediaUpload({
            user: mockUser,
            setStatusMessage: mockSetStatusMessage
        }));

        const mockVideoFile = new File([], 'test.mp4', { type: 'video/mp4' });
        const mockVideoAsset = { id: 'v1', file: mockVideoFile, thumbnail: new Blob() };

        await result.current.uploadMedia('spot123', [], [mockVideoAsset as any]);

        expect(supabase.storage.from).toHaveBeenCalledWith('spot-media');
        expect(supabase.from).toHaveBeenCalledWith('spot_videos');
        expect(mockSetStatusMessage).toHaveBeenCalledWith(expect.stringContaining('Uploading 1 videos'));
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
