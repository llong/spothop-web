import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContestUsageRestrictionFields } from '../ContestUsageRestrictionFields';

describe('ContestUsageRestrictionFields', () => {
    const mockOnCriteriaChange = vi.fn();
    const defaultFormData = {
        criteria: {
            specific_spot_id: 'spot-123',
            require_spot_creator_is_competitor: false,
            spot_creation_time_frame: 'anytime',
            media_creation_time_frame: 'last_30_days',
            required_media_types: ['video'],
            max_entries_per_user: 1
        }
    } as any;

    const renderComponent = (props = {}) => {
        return render(
            <ContestUsageRestrictionFields
                formData={defaultFormData}
                onCriteriaChange={mockOnCriteriaChange}
                {...props}
            />
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders basic fields and headings', () => {
        renderComponent();
        expect(screen.getByText(/usage restrictions/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/specific spot id restriction/i)).toHaveValue('spot-123');
    });

    it('handles spot ID restriction change', () => {
        renderComponent();
        const input = screen.getByLabelText(/specific spot id restriction/i);
        fireEvent.change(input, { target: { value: 'new-spot-id' } });
        expect(mockOnCriteriaChange).toHaveBeenCalledWith('specific_spot_id', 'new-spot-id');
    });

    it('handles switch toggle', () => {
        renderComponent();
        const label = screen.getByLabelText(/require competitor created the spot/i);
        fireEvent.click(label);
        expect(mockOnCriteriaChange).toHaveBeenCalledWith('require_spot_creator_is_competitor', true);
    });

    it('handles media types selection', () => {
        renderComponent();
        const photoButton = screen.getByRole('button', { name: /photo/i });
        fireEvent.click(photoButton);
        expect(mockOnCriteriaChange).toHaveBeenCalledWith('required_media_types', ['video', 'photo']);
    });

    it('handles max entries change', () => {
        renderComponent();
        const input = screen.getByLabelText(/max entries per user/i);
        fireEvent.change(input, { target: { value: '5' } });
        expect(mockOnCriteriaChange).toHaveBeenCalledWith('max_entries_per_user', 5);
    });
});
