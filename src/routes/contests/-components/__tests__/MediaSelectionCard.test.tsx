import { render, screen, fireEvent } from '@testing-library/react';
import { MediaSelectionCard } from '../MediaSelectionCard';
import { vi, describe, it, expect } from 'vitest';

describe('MediaSelectionCard', () => {
    const mockItem = {
        id: 'media-1',
        type: 'photo',
        url: 'image.jpg',
    };
    const mockProps = {
        item: mockItem,
        isSelected: false,
        onSelect: vi.fn(),
        onFullscreen: vi.fn(),
    };

    it('renders media card', () => {
        render(<MediaSelectionCard {...mockProps} />);
        
        // CardMedia img
        expect(screen.getByRole('img')).toHaveAttribute('src', 'image.jpg');
    });

    it('renders video icon for video type', () => {
        const videoItem = { ...mockItem, type: 'video', url: 'video.mp4' };
        render(<MediaSelectionCard {...mockProps} item={videoItem} />);
        
        expect(screen.getByTestId('PlayArrowIcon')).toBeInTheDocument();
    });

    it('handles click selection', () => {
        render(<MediaSelectionCard {...mockProps} />);
        
        // Find the CardActionArea button (it has specific class or we can use getAllByRole and find the one without the icon)
        const buttons = screen.getAllByRole('button');
        const actionArea = buttons.find(b => b.classList.contains('MuiCardActionArea-root'));
        fireEvent.click(actionArea!);
        
        expect(mockProps.onSelect).toHaveBeenCalledWith('media-1', 'photo');
    });

    it('shows selected state', () => {
        render(<MediaSelectionCard {...mockProps} isSelected={true} />);
        
        expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
    });

    it('handles fullscreen click', () => {
        render(<MediaSelectionCard {...mockProps} />);
        
        const fullscreenButton = screen.getByTestId('FullscreenIcon').closest('button');
        
        // Ensure the button exists before clicking
        expect(fullscreenButton).toBeInTheDocument();

        fireEvent.click(fullscreenButton!);
        
        expect(mockProps.onFullscreen).toHaveBeenCalledWith(mockItem);
    });
});
