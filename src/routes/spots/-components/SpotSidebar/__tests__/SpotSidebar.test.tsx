import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SpotSidebar } from '../SpotSidebar';

vi.mock('../SidebarActions', () => ({
    SidebarActions: ({ onDirectionsClick }: any) => (
        <button onClick={onDirectionsClick}>Actions</button>
    )
}));

describe('SpotSidebar', () => {
    const mockSpot = {
        id: 's1',
        name: 'Spot Name',
        address: '123 St',
        latitude: 10,
        longitude: 20,
        description: 'A cool spot'
    };

    const defaultProps = {
        spot: mockSpot as any,
        isFavorited: false,
        onToggleFavorite: vi.fn(),
        onAddMedia: vi.fn(),
        isLoggedIn: true
    };

    it('renders spot description', () => {
        render(<SpotSidebar {...defaultProps} />);
        expect(screen.getByText('About this spot')).toBeInTheDocument();
        expect(screen.getByText('A cool spot')).toBeInTheDocument();
    });

    it('renders without description', () => {
        const spotNoDesc = { ...mockSpot, description: '' };
        render(<SpotSidebar {...defaultProps} spot={spotNoDesc as any} />);
        expect(screen.queryByText('About this spot')).not.toBeInTheDocument();
    });

    it('opens maps when actions trigger directions', () => {
        window.open = vi.fn();
        render(<SpotSidebar {...defaultProps} />);
        
        const button = screen.getByText('Actions');
        fireEvent.click(button);
        
        expect(window.open).toHaveBeenCalledWith(
            expect.stringContaining('maps'),
            '_blank'
        );
    });
});
