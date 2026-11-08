import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVideoUpload } from '@/routes/spots/hooks/-useVideoUpload';
import { captureVideoThumbnail } from '@/utils/videoProcessing';

vi.mock('uuid', () => ({ v4: () => 'video-id' }));
vi.mock('@/utils/videoProcessing', () => ({ captureVideoThumbnail: vi.fn() }));

describe('useVideoUpload', () => {
    const onFilesSelect = vi.fn();
    const original = new File(['raw'], 'skate.mov', { type: 'video/quicktime' });

    /** Hook with a file picked and the trimmer open. */
    const setup = () => {
        const hook = renderHook(() => useVideoUpload(onFilesSelect));
        act(() => hook.result.current.setPendingFile(original));
        return hook;
    };

    beforeEach(() => vi.clearAllMocks());

    it('adds the trimmed video with its thumbnail and closes the trimmer', async () => {
        const thumbnail = new File(['t'], 'thumb.jpg', { type: 'image/jpeg' });
        vi.mocked(captureVideoThumbnail).mockResolvedValue(thumbnail);
        const { result } = setup();

        await act(() => result.current.handleTrimmed(new Blob(['out'])));

        const [asset] = result.current.selectedVideos;
        expect(asset).toMatchObject({ id: 'video-id', thumbnail });
        expect(asset.file.name).toBe('skate_trimmed.mp4');
        expect(onFilesSelect).toHaveBeenCalledWith([asset]);
        expect(result.current.pendingFile).toBeNull();
    });

    it('still adds the video when the thumbnail cannot be generated', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(captureVideoThumbnail).mockRejectedValue(new Error('no frame'));
        const { result } = setup();

        await act(() => result.current.handleTrimmed(new Blob(['out'])));

        expect(result.current.selectedVideos).toHaveLength(1);
        expect(result.current.selectedVideos[0].thumbnail).toBeUndefined();
    });
});
