import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaGalleryItem } from '../MediaGalleryItem';

describe('MediaGalleryItem', () => {
    const mockOnClick = vi.fn();
    
    const photoItem = {
        id: '1',
        type: 'photo' as const,
        url: 'test-image.jpg',
        created_at: '2024-01-01T12:00:00Z',
        spot: {
            id: 'spot1',
            name: 'Spot One',
            city: 'Berlin',
            state: 'Berlin',
            country: 'Germany'
        }
    };

    const videoItem = {
        id: '2',
        type: 'video' as const,
        url: 'test-video.mp4',
        thumbnailUrl: 'test-thumb.jpg',
        created_at: '2024-01-01T12:00:00Z',
        spot: {
            id: 'spot2',
            name: 'Spot Two',
            city: 'Paris',
            state: 'Ile-de-France',
            country: 'France'
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders photo item correctly', () => {
        render(<MediaGalleryItem item={photoItem as any} onClick={mockOnClick} index={0} />);
        
        expect(screen.getByText('Spot One')).toBeInTheDocument();
        expect(screen.getByText(/Berlin, Germany/)).toBeInTheDocument();
        
        const img = screen.getByRole('img');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'test-image.jpg');
    });

    it('renders video item correctly with play icon', () => {
        render(<MediaGalleryItem item={videoItem as any} onClick={mockOnClick} index={1} />);
        
        expect(screen.getByText('Spot Two')).toBeInTheDocument();
        
        // Video thumbnail
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', 'test-thumb.jpg');
        
        // Play icon (it's an SVG, usually has a specific name in MUI)
        expect(screen.getByTestId('PlayCircleOutlineIcon')).toBeInTheDocument();
    });

    it('calls onClick when item is clicked', () => {
        render(<MediaGalleryItem item={photoItem as any} onClick={mockOnClick} index={2} />);
        
        // Find the clickable card (it has more content than just img)
        const card = screen.getByText('Spot One').closest('.MuiCard-root');
        fireEvent.click(card!);
        
        expect(mockOnClick).toHaveBeenCalledWith(2);
    });
});
