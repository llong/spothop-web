import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContestSubmissionCriteriaFields } from '../ContestSubmissionCriteriaFields';

describe('ContestSubmissionCriteriaFields', () => {
    const mockOnCriteriaChange = vi.fn();
    const mockOnRadiusUnitChange = vi.fn();
    const mockOnLocationSearch = vi.fn();
    
    const defaultFormData = {
        title: 'Test Contest',
        criteria: {
            allowed_spot_types: ['rail'],
            allowed_rider_types: ['skateboard'],
            allowed_difficulties: ['intermediate'],
            allowed_is_lit: true,
            allowed_kickout_risk_max: 3,
            location_radius_km: 50
        }
    } as any;

    const renderComponent = (props = {}) => {
        return render(
            <ContestSubmissionCriteriaFields
                formData={defaultFormData}
                onCriteriaChange={mockOnCriteriaChange}
                radiusUnit="km"
                onRadiusUnitChange={mockOnRadiusUnitChange}
                onLocationSearch={mockOnLocationSearch}
                {...props}
            />
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders heading and sections', () => {
        renderComponent();
        expect(screen.getByText(/submission criteria/i)).toBeInTheDocument();
        expect(screen.getByText(/allowed spot types/i)).toBeInTheDocument();
        expect(screen.getByText(/allowed rider types/i)).toBeInTheDocument();
    });

    it('renders Must be Lit switch correctly', () => {
        renderComponent();
        const litSwitch = screen.getByLabelText(/must be lit/i);
        expect(litSwitch).toBeChecked();
    });

    it('calls onCriteriaChange when switch is toggled', () => {
        renderComponent();
        const litSwitch = screen.getByLabelText(/must be lit/i);
        fireEvent.click(litSwitch);
        expect(mockOnCriteriaChange).toHaveBeenCalledWith('allowed_is_lit', false);
    });

    it('calls onCriteriaChange when a spot type is clicked', () => {
        renderComponent();
        const ledgeButton = screen.getByRole('button', { name: 'ledge' });
        fireEvent.click(ledgeButton);
        expect(mockOnCriteriaChange).toHaveBeenCalledWith('allowed_spot_types', ['rail', 'ledge']);
    });

    it('calls onRadiusUnitChange when unit button clicked', () => {
        renderComponent();
        const milesButton = screen.getByRole('button', { name: /miles/i });
        fireEvent.click(milesButton);
        expect(mockOnRadiusUnitChange).toHaveBeenCalledWith('miles');
    });
});
