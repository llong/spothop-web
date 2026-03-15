import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LightboxDialog } from '../LightboxDialog';

// Mock tanstack router Link
vi.mock('@tanstack/react-router', () => ({
    Link: ({ children }: any) => <div>{children}</div>
}));

describe('LightboxDialog', () => {
    const mockOnClose = vi.fn();
    const mockOnNext = vi.fn();
    const mockOnPrev = vi.fn();
    
    const mockMedia = { 
        id: '1', 
        type: 'photo' as const, 
        url: 'img1.jpg', 
        created_at: '2024-01-01T12:00:00Z',
        spot: { id: 's1', name: 'Spot One', city: 'Berlin', country: 'Germany' }
    };

    const renderComponent = (props = {}) => {
        return render(
            <LightboxDialog
                open={true}
                onClose={mockOnClose}
                currentMedia={mockMedia as any}
                onNext={mockOnNext}
                onPrev={mockOnPrev}
                hasMultiple={true}
                {...props}
            />
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the dialog when open', () => {
        renderComponent();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Spot One')).toBeInTheDocument();
    });

    it('does not render when currentMedia is null', () => {
        renderComponent({ currentMedia: null });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders current media item', () => {
        renderComponent();
        const img = screen.getByRole('img');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'img1.jpg');
    });

    it('shows navigation buttons when hasMultiple is true', () => {
        renderComponent({ hasMultiple: true });
        // The icons are in buttons
        const buttons = screen.getAllByRole('button');
        // Close button + Prev + Next = 3
        expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it('hides navigation buttons when hasMultiple is false', () => {
        renderComponent({ hasMultiple: false });
        const buttons = screen.getAllByRole('button');
        // Just Close button
        expect(buttons).toHaveLength(1);
    });

    it('calls onNext when next button clicked', () => {
        renderComponent();
        // The buttons don't have aria-labels in implementation yet, 
        // but we can find them by icon or position. 
        // Looking at implementation, they are just IconButtons.
        // Let's find the one with ChevronRight.
        const buttons = screen.getAllByRole('button');
        // Based on implementation order: Close, Prev, Next
        fireEvent.click(buttons[2]); 
        expect(mockOnNext).toHaveBeenCalled();
    });

    it('calls onPrev when prev button clicked', () => {
        renderComponent();
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[1]); 
        expect(mockOnPrev).toHaveBeenCalled();
    });

    it('calls onClose when close button clicked', () => {
        renderComponent();
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[0]); 
        expect(mockOnClose).toHaveBeenCalled();
    });
});
