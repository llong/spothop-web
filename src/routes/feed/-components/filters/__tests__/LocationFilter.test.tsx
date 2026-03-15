import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocationFilter } from '../LocationFilter';
import { useGeolocation } from 'src/hooks/useGeolocation';

vi.mock('src/hooks/useGeolocation', () => ({
    useGeolocation: vi.fn()
}));

vi.mock('src/routes/-components/PlaceAutocomplete', () => ({
    PlaceAutocomplete: vi.fn(({ onPlaceSelect }) => (
        <input 
            data-testid="mock-place-autocomplete" 
            onChange={() => onPlaceSelect({ name: 'Test Place' })}
        />
    ))
}));

describe('LocationFilter', () => {
    const defaultProps = {
        nearMe: false,
        selectedLocation: undefined,
        maxDistKm: 10,
        locationInputRef: { current: null },
        onNearMeChange: vi.fn(),
        onPlaceSelect: vi.fn(),
        onDistChange: vi.fn()
    };

    const mockCenterMapOnUser = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useGeolocation as any).mockReturnValue({
            centerMapOnUser: mockCenterMapOnUser
        });
    });

    it('renders correctly when nearMe is false', () => {
        render(<LocationFilter {...defaultProps} />);

        expect(screen.getByText('Location')).toBeInTheDocument();
        expect(screen.getByTestId('mock-place-autocomplete')).toBeInTheDocument();
        expect(screen.getByText('Search Distance: 10 km')).toBeInTheDocument();
        
        // Slider should be disabled when not nearMe and no selected location
        const slider = screen.getByRole('slider');
        expect(slider).toBeDisabled();
    });

    it('renders correctly when nearMe is true', () => {
        render(<LocationFilter {...defaultProps} nearMe={true} />);

        // PlaceAutocomplete should not be rendered
        expect(screen.queryByTestId('mock-place-autocomplete')).not.toBeInTheDocument();
        
        // Slider should be enabled
        const slider = screen.getByRole('slider');
        expect(slider).not.toBeDisabled();
    });

    it('renders selected location text when provided', () => {
        render(
            <LocationFilter 
                {...defaultProps} 
                selectedLocation={{ name: 'New York', lat: 40, lng: -74 }} 
            />
        );

        expect(screen.getByText('Selected: New York')).toBeInTheDocument();
        
        // Slider should be enabled when there's a selected location
        const slider = screen.getByRole('slider');
        expect(slider).not.toBeDisabled();
    });

    it('handles turning off nearMe toggle', () => {
        render(<LocationFilter {...defaultProps} nearMe={true} />);
        
        const switchInput = screen.getByRole('switch');
        fireEvent.click(switchInput); // Toggle off
        
        expect(defaultProps.onNearMeChange).toHaveBeenCalledWith(false);
        expect(mockCenterMapOnUser).not.toHaveBeenCalled();
    });

    it('handles turning on nearMe toggle successfully', async () => {
        mockCenterMapOnUser.mockResolvedValueOnce({ lat: 10, lng: 20 });
        
        render(<LocationFilter {...defaultProps} />);
        
        const switchInput = screen.getByRole('switch');
        fireEvent.click(switchInput); // Toggle on
        
        expect(mockCenterMapOnUser).toHaveBeenCalledTimes(1);
        
        await waitFor(() => {
            expect(defaultProps.onNearMeChange).toHaveBeenCalledWith(true);
        });
    });

    it('handles turning on nearMe toggle with failure', async () => {
        mockCenterMapOnUser.mockResolvedValueOnce(null);
        
        render(<LocationFilter {...defaultProps} />);
        
        const switchInput = screen.getByRole('switch');
        fireEvent.click(switchInput); // Toggle on
        
        expect(mockCenterMapOnUser).toHaveBeenCalledTimes(1);
        
        await waitFor(() => {
            expect(defaultProps.onNearMeChange).toHaveBeenCalledWith(false);
        });
    });

    it('calls onDistChange when slider changes', () => {
        render(<LocationFilter {...defaultProps} nearMe={true} />);
        
        const slider = screen.getByRole('slider');
        
        // MUI Slider requires complex interaction, we can mock the change event or simulate arrow keys
        fireEvent.keyDown(slider, { key: 'ArrowRight' });
        
        expect(defaultProps.onDistChange).toHaveBeenCalled();
    });
});
