import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SidebarActions } from '../SidebarActions';

describe('SidebarActions', () => {
    const mockProps = {
        isLoggedIn: true,
        isFavorited: false,
        onToggleFavorite: vi.fn(),
        onAddMedia: vi.fn(),
        onDirectionsClick: vi.fn(),
    };

    it('renders directions button always', () => {
        render(<SidebarActions {...mockProps} isLoggedIn={false} />);
        expect(screen.getByText(/Get Directions/i)).toBeInTheDocument();
    });

    it('hides save and add media when not logged in', () => {
        render(<SidebarActions {...mockProps} isLoggedIn={false} />);
        expect(screen.queryByText(/Save Spot/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Add Photo\/Video/i)).not.toBeInTheDocument();
    });

    it('shows save and add media when logged in', () => {
        render(<SidebarActions {...mockProps} />);
        expect(screen.getByText(/Save Spot/i)).toBeInTheDocument();
        expect(screen.getByText(/Add Photo\/Video/i)).toBeInTheDocument();
    });

    it('shows Saved when favorited', () => {
        render(<SidebarActions {...mockProps} isFavorited={true} />);
        expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('calls handlers on click', () => {
        render(<SidebarActions {...mockProps} />);
        
        fireEvent.click(screen.getByText(/Get Directions/i));
        expect(mockProps.onDirectionsClick).toHaveBeenCalled();

        fireEvent.click(screen.getByText(/Save Spot/i));
        expect(mockProps.onToggleFavorite).toHaveBeenCalled();

        fireEvent.click(screen.getByText(/Add Photo\/Video/i));
        expect(mockProps.onAddMedia).toHaveBeenCalled();
    });
});
