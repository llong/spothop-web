import { render, screen } from '@testing-library/react';
import { SubmissionConfirmStep } from '../SubmissionConfirmStep';
import { describe, it, expect } from 'vitest';

describe('SubmissionConfirmStep', () => {
    const mockMedia = { id: 'media-1', url: 'image.jpg' };
    const mockSpot = {
        id: 'spot-1',
        name: 'Spot 1',
        address: '123 St',
        city: 'City',
    };
    const mockProps = {
        selectedMediaId: 'media-1',
        eligibleMedia: [mockMedia],
        spotDetails: mockSpot,
        eligibleSpots: [mockSpot],
        selectedSpotId: 'spot-1',
        selectedMediaType: 'photo' as const,
        mediaLoading: false,
        submitError: null,
    };

    it('renders confirmation details', () => {
        render(<SubmissionConfirmStep {...mockProps} />);

        expect(screen.getByText('Ready to submit?')).toBeInTheDocument();
        expect(screen.getByText('Spot 1')).toBeInTheDocument();
        expect(screen.getByText('123 St, City')).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', 'image.jpg');
    });

    it('renders video confirmation', () => {
        const videoProps = {
            ...mockProps,
            selectedMediaType: 'video' as const,
            eligibleMedia: [{ id: 'media-1', url: 'video.mp4' }],
        };
        render(<SubmissionConfirmStep {...videoProps} />);

        // Check for play icon overlay
        expect(screen.getByTestId('PlayArrowIcon')).toBeInTheDocument();
    });

    it('shows loading state', () => {
        render(<SubmissionConfirmStep {...mockProps} mediaLoading={true} spotDetails={null} />);

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows error message', () => {
        const error = new Error('Submission failed');
        render(<SubmissionConfirmStep {...mockProps} submitError={error} />);

        expect(screen.getByText('Submission failed')).toBeInTheDocument();
    });
});
