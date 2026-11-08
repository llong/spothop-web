import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoTrimmer } from '@/routes/spots/-components/VideoTrimmer';
import { trimVideo, isVideoTrimSupported } from '@/utils/videoProcessing';

vi.mock('@/utils/videoProcessing', () => ({
    trimVideo: vi.fn(),
    isVideoTrimSupported: vi.fn(),
}));

describe('VideoTrimmer', () => {
    const file = new File(['video'], 'clip.mp4', { type: 'video/mp4' });
    const onTrimmed = vi.fn();
    const onCancel = vi.fn();

    /** Renders the trimmer and reports a 30s video so the slider has a range (0-20s selected). */
    const renderLoaded = (maxDuration = 20) => {
        render(<VideoTrimmer file={file} onTrimmed={onTrimmed} onCancel={onCancel} maxDuration={maxDuration} />);
        const video = document.querySelector('video') as HTMLVideoElement;
        Object.defineProperty(video, 'duration', { value: 30, configurable: true });
        video.pause = vi.fn();
        fireEvent.loadedMetadata(video);
        return video;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(isVideoTrimSupported).mockReturnValue(true);
    });

    it('selects the first maxDuration seconds by default', () => {
        renderLoaded();
        expect(screen.getByText(/Selected: 20.0s \(Max 20s\)/)).toBeInTheDocument();
    });

    it('trims the selected range and returns the result', async () => {
        const blob = new Blob(['out'], { type: 'video/mp4' });
        vi.mocked(trimVideo).mockResolvedValue(blob);
        renderLoaded();

        fireEvent.click(screen.getByText('Trim & Save'));

        await waitFor(() => expect(onTrimmed).toHaveBeenCalledWith(blob));
        expect(trimVideo).toHaveBeenCalledWith(file, 0, 20, expect.any(Function), expect.any(AbortSignal));
    });

    it('shows an error instead of hanging when trimming fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(trimVideo).mockRejectedValue(new Error('Encoder failed'));
        renderLoaded();

        fireEvent.click(screen.getByText('Trim & Save'));

        expect(await screen.findByText('Encoder failed')).toBeInTheDocument();
        expect(screen.getByText('Trim & Save')).toBeEnabled();
        expect(onTrimmed).not.toHaveBeenCalled();
    });

    it('can be cancelled before processing starts', () => {
        renderLoaded();
        fireEvent.click(screen.getByText('Cancel'));
        expect(onCancel).toHaveBeenCalled();
    });

    it('aborts the running trim when cancelled', () => {
        vi.mocked(trimVideo).mockReturnValue(new Promise(() => {}));
        renderLoaded();

        fireEvent.click(screen.getByText('Trim & Save'));
        const signal = vi.mocked(trimVideo).mock.calls[0][4] as AbortSignal;
        fireEvent.click(screen.getByText('Cancel'));

        expect(signal.aborted).toBe(true);
        expect(onCancel).toHaveBeenCalled();
    });

    it('disables trimming and explains why when the browser has no video encoder', () => {
        vi.mocked(isVideoTrimSupported).mockReturnValue(false);
        renderLoaded();

        expect(screen.getByText(/can't process video/)).toBeInTheDocument();
        expect(screen.getByText('Trim & Save')).toBeDisabled();
    });

    describe('scrubbing the range', () => {
        const thumb = (index: number) => document.querySelector(`input[data-index="${index}"]`) as HTMLInputElement;

        it('previews the last kept frame when the end thumb moves', () => {
            const video = renderLoaded();
            fireEvent.change(thumb(1), { target: { value: '15' } });

            expect(video.currentTime).toBeCloseTo(14.95);
            expect(video.pause).toHaveBeenCalled();
        });

        it('previews the first kept frame when the start thumb moves', () => {
            const video = renderLoaded();
            fireEvent.change(thumb(0), { target: { value: '5' } });

            expect(video.currentTime).toBe(5);
        });

        it('stops the end thumb at the max length', () => {
            renderLoaded(10);
            fireEvent.change(thumb(1), { target: { value: '25' } });

            expect(screen.getByText(/Selected: 10.0s/)).toBeInTheDocument();
        });
    });
});
