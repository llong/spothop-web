import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FlagSpotDialog } from '../FlagSpotDialog';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock useFlagging hook
const mockFlagSpot = vi.fn();
const mockSetError = vi.fn();
vi.mock('src/hooks/useFlagging', () => ({
    useFlagging: () => ({
        flagSpot: mockFlagSpot,
        loading: false,
        error: null,
        setError: mockSetError,
    }),
}));

describe('FlagSpotDialog', () => {
    const defaultProps = {
        spotId: '123',
        spotName: 'Test Spot',
        open: true,
        onClose: vi.fn(),
        onSuccess: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly with spot name', () => {
        render(<FlagSpotDialog {...defaultProps} />);
        expect(screen.getByText(/Report Spot: Test Spot/i)).toBeInTheDocument();
    });

    it('submits successfully with happy path', async () => {
        mockFlagSpot.mockResolvedValue(true);
        render(<FlagSpotDialog {...defaultProps} />);

        // Default reason is inappropriate_content
        const submitBtn = screen.getByText(/Submit Report/i);
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockFlagSpot).toHaveBeenCalledWith('123', 'inappropriate_content', '');
            expect(defaultProps.onSuccess).toHaveBeenCalled();
            expect(defaultProps.onClose).toHaveBeenCalled();
        });
    });

    it('requires details when "Other" is selected', async () => {
        render(<FlagSpotDialog {...defaultProps} />);

        const otherRadio = screen.getByLabelText(/Other/i);
        fireEvent.click(otherRadio);

        const submitBtn = screen.getByText(/Submit Report/i);

        // Button should be disabled if details are empty for "Other"
        expect(submitBtn).toBeDisabled();

        const detailsInput = screen.getByLabelText(/Please specify/i);
        fireEvent.change(detailsInput, { target: { value: 'Some custom reason' } });

        expect(submitBtn).not.toBeDisabled();

        mockFlagSpot.mockResolvedValue(true);
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockFlagSpot).toHaveBeenCalledWith('123', 'other', 'Some custom reason');
        });
    });

    it('handles API errors', async () => {
        // We'll re-render with an error state to test the UI display
        // Since we mocked useFlagging at the top, we need to adjust the mock for this test
        vi.mocked(mockFlagSpot).mockResolvedValue(false);

        render(<FlagSpotDialog {...defaultProps} />);

        const submitBtn = screen.getByText(/Submit Report/i);
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockFlagSpot).toHaveBeenCalled();
            expect(defaultProps.onSuccess).not.toHaveBeenCalled();
            expect(defaultProps.onClose).not.toHaveBeenCalled();
        });
    });

    it('calls onClose when Cancel is clicked', () => {
        render(<FlagSpotDialog {...defaultProps} />);
        const cancelBtn = screen.getByText(/Cancel/i);
        fireEvent.click(cancelBtn);
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('clears details when reason changes', () => {
        render(<FlagSpotDialog {...defaultProps} />);

        const otherRadio = screen.getByLabelText(/Other/i);
        fireEvent.click(otherRadio);

        const detailsInput = screen.getByLabelText(/Please specify/i);
        fireEvent.change(detailsInput, { target: { value: 'Some custom reason' } });
        expect(detailsInput).toHaveValue('Some custom reason');

        const duplicateRadio = screen.getByLabelText(/Duplicate Spot/i);
        fireEvent.click(duplicateRadio);

        const updatedDetailsInput = screen.getByLabelText(/Additional details/i);
        expect(updatedDetailsInput).toHaveValue('');
    });
});
