import { render, screen, fireEvent } from '@testing-library/react';
import { ContestSubmissionModal } from '../ContestSubmissionModal';
import { useContestSubmission } from '../../hooks/-useContestSubmission';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../hooks/-useContestSubmission');
vi.mock('../SpotSelectionCard', () => ({
    SpotSelectionCard: ({ spot, isSelected, onSelect }: any) => (
        <div data-testid="spot-card" onClick={() => onSelect(spot.id)}>
            {spot.name} {isSelected ? '(selected)' : ''}
        </div>
    ),
}));
vi.mock('../MediaSelectionCard', () => ({
    MediaSelectionCard: ({ item, isSelected, onSelect }: any) => (
        <div data-testid="media-card" onClick={() => onSelect(item.id, item.type)}>
            Media {item.id} {isSelected ? '(selected)' : ''}
        </div>
    ),
}));
vi.mock('../SubmissionConfirmStep', () => ({
    SubmissionConfirmStep: () => <div data-testid="confirm-step">Confirm Step</div>,
}));

describe('ContestSubmissionModal', () => {
    const mockOnClose = vi.fn();
    const mockContest = {
        id: 'contest-1',
        title: 'Contest 1',
        criteria: { required_media_types: ['video'] },
    } as any;

    const defaultHookValues = {
        activeStep: 0,
        setActiveStep: vi.fn(),
        selectedSpotId: null,
        setSelectedSpotId: vi.fn(),
        selectedMediaId: null,
        setSelectedMediaId: vi.fn(),
        selectedMediaType: null,
        setSelectedMediaType: vi.fn(),
        eligibleSpots: [{ id: 'spot-1', name: 'Spot 1' }],
        eligibleMedia: [{ id: 'media-1', type: 'video' }],
        spotDetails: {},
        spotsLoading: false,
        favoritesLoading: false,
        mediaLoading: false,
        submitEntry: vi.fn(),
        isSubmitting: false,
        submitError: null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useContestSubmission as any).mockReturnValue(defaultHookValues);
    });

    it('renders step 1 (Select Spot)', () => {
        render(<ContestSubmissionModal open={true} onClose={mockOnClose} contest={mockContest} />);

        expect(screen.getByText('Submit Entry: Contest 1')).toBeInTheDocument();
        expect(screen.getByText('Select Spot')).toBeInTheDocument();
        expect(screen.getByText('Select one of your eligible spots:')).toBeInTheDocument();
        expect(screen.getByText('Spot 1')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('renders step 2 (Select Media)', () => {
        (useContestSubmission as any).mockReturnValue({
            ...defaultHookValues,
            activeStep: 1,
            selectedSpotId: 'spot-1',
        });
        render(<ContestSubmissionModal open={true} onClose={mockOnClose} contest={mockContest} />);

        expect(screen.getByText('Choose Media')).toBeInTheDocument();
        expect(screen.getByText('Media media-1')).toBeInTheDocument();
    });

    it('renders step 3 (Confirm)', () => {
        (useContestSubmission as any).mockReturnValue({
            ...defaultHookValues,
            activeStep: 2,
            selectedSpotId: 'spot-1',
            selectedMediaId: 'media-1',
        });
        render(<ContestSubmissionModal open={true} onClose={mockOnClose} contest={mockContest} />);

        expect(screen.getByText('Confirm')).toBeInTheDocument();
        expect(screen.getByTestId('confirm-step')).toBeInTheDocument();
        expect(screen.getByText('Confirm Submission')).toBeInTheDocument();
    });

    it('navigates steps', () => {
        // Since useContestSubmission is mocked, we need to manually simulate state changes if we want to test interaction flow fully
        // But usually we test that buttons call the setters
        
        // Let's test Next button calls setActiveStep
        const setActiveStep = vi.fn();
        (useContestSubmission as any).mockReturnValue({
            ...defaultHookValues,
            activeStep: 0,
            selectedSpotId: 'spot-1',
            setActiveStep,
        });

        render(<ContestSubmissionModal open={true} onClose={mockOnClose} contest={mockContest} />);
        
        fireEvent.click(screen.getByText('Next'));
        expect(setActiveStep).toHaveBeenCalledWith(1);
    });

    it('submits entry', () => {
        const submitEntry = vi.fn();
        (useContestSubmission as any).mockReturnValue({
            ...defaultHookValues,
            activeStep: 2,
            selectedSpotId: 'spot-1',
            selectedMediaId: 'media-1',
            submitEntry,
        });

        render(<ContestSubmissionModal open={true} onClose={mockOnClose} contest={mockContest} />);

        fireEvent.click(screen.getByText('Confirm Submission'));
        expect(submitEntry).toHaveBeenCalled();
    });
});
