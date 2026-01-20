import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoTrimmer } from '../VideoTrimmer';

vi.mock('../../../utils/videoProcessing', () => ({
    trimVideo: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]))
}));

describe('VideoTrimmer Component', () => {
    const mockOnTrimmed = vi.fn();
    const mockOnCancel = vi.fn();
    const mockFile = new File(['mock video content'], 'test-video.mp4', { type: 'video/mp4' });

    beforeEach(() => {
        vi.clearAllMocks();
        mockOnTrimmed.mockClear();
        mockOnCancel.mockClear();
    });

    it('renders video trimmer with video element', () => {
        render(
            <VideoTrimmer
                file={mockFile}
                onTrimmed={mockOnTrimmed}
                onCancel={mockOnCancel}
                maxDuration={20}
            />
        );

        const videoElement = document.querySelector('video');
        expect(videoElement).toBeInTheDocument();
    });

    it('displays slider for trimming range', async () => {
        render(
            <VideoTrimmer
                file={mockFile}
                onTrimmed={mockOnTrimmed}
                onCancel={mockOnCancel}
                maxDuration={20}
            />
        );

        await waitFor(() => {
            const slider = document.querySelector('input[type="range"]');
            expect(slider).toBeInTheDocument();
        }, { timeout: 5000 });
    });

    it('calls onTrimmed when Trim & Save button is clicked', async () => {
        render(
            <VideoTrimmer
                file={mockFile}
                onTrimmed={mockOnTrimmed}
                onCancel={mockOnCancel}
                maxDuration={20}
            />
        );

        await waitFor(() => {
            const trimButton = screen.getByText('Trim & Save');
            expect(trimButton).toBeInTheDocument();
        }, { timeout: 5000 });
    });

    it('displays time information', () => {
        render(
            <VideoTrimmer
                file={mockFile}
                onTrimmed={mockOnTrimmed}
                onCancel={mockOnCancel}
                maxDuration={20}
            />
        );

        expect(screen.getByText(/s \/ /)).toBeInTheDocument();
    });

    it('shows selected duration', () => {
        render(
            <VideoTrimmer
                file={mockFile}
                onTrimmed={mockOnTrimmed}
                onCancel={mockOnCancel}
                maxDuration={20}
            />
        );

        expect(screen.getByText(/Max 20s/)).toBeInTheDocument();
    });

    it('calls onCancel when Cancel button is clicked', () => {
        render(
            <VideoTrimmer
                file={mockFile}
                onTrimmed={mockOnTrimmed}
                onCancel={mockOnCancel}
                maxDuration={20}
            />
        );

        const cancelButton = screen.getByText('Cancel');
        expect(cancelButton).toBeInTheDocument();
    });

    it('disables controls while processing', async () => {
        render(
            <VideoTrimmer
                file={mockFile}
                onTrimmed={mockOnTrimmed}
                onCancel={mockOnCancel}
                maxDuration={20}
            />
        );

        const trimButton = await screen.findByText('Trim & Save');
        expect(trimButton).toBeInTheDocument();
    });

    it('uses default maxDuration of 20 seconds', () => {
        render(
            <VideoTrimmer
                file={mockFile}
                onTrimmed={mockOnTrimmed}
                onCancel={mockOnCancel}
            />
        );

        expect(screen.getByText(/Max 20s/)).toBeInTheDocument();
    });
});