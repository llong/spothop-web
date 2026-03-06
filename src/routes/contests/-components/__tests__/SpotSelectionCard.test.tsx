import { render, screen, fireEvent } from '@testing-library/react';
import { SpotSelectionCard } from '../SpotSelectionCard';
import { vi, describe, it, expect } from 'vitest';

describe('SpotSelectionCard', () => {
    const mockSpot = {
        id: 'spot-1',
        name: 'Spot 1',
        thumbnail_small_url: 'thumb.jpg',
        address: '123 St',
        city: 'City',
        state: 'ST',
        country: 'Country',
        created_at: new Date('2023-01-01').toISOString(),
        spot_type: ['skate_park'],
    };
    const mockProps = {
        spot: mockSpot,
        isSelected: false,
        onSelect: vi.fn(),
    };

    it('renders spot details', () => {
        render(<SpotSelectionCard {...mockProps} />);
        
        expect(screen.getByText('Spot 1')).toBeInTheDocument();
        expect(screen.getByText('123 St, City, ST, Country')).toBeInTheDocument();
        expect(screen.getByText('skate_park')).toBeInTheDocument();
        expect(screen.getByText(/1\/1\/2023/)).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', 'thumb.jpg');
    });

    it('handles selection', () => {
        render(<SpotSelectionCard {...mockProps} />);
        
        fireEvent.click(screen.getByRole('button'));
        expect(mockProps.onSelect).toHaveBeenCalledWith('spot-1');
    });

    it('shows selected state', () => {
        render(<SpotSelectionCard {...mockProps} isSelected={true} />);
        
        expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
    });
});
