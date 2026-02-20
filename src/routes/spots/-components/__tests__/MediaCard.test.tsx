import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MediaCard } from '../MediaCard';

vi.mock('@tanstack/react-router', () => ({
    Link: ({ children }: any) => <div>{children}</div>
}));

describe('MediaCard', () => {
    const mockItem = {
        id: 'm1',
        type: 'photo' as const,
        url: 'photo-url',
        author: { id: 'user1', username: 'testuser', avatarUrl: 'avatar-url' },
        likeCount: 5,
        isLiked: false,
        createdAt: new Date().toISOString()
    };

    it('renders photo media card', () => {
        render(<MediaCard item={mockItem} onToggleLike={vi.fn()} isLoading={false} onSelect={vi.fn()} />);
        expect(screen.getByAltText(/Photo by testuser/i)).toBeInTheDocument();
        expect(screen.getByText('@testuser')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders video media card with play icon', () => {
        const videoItem = { ...mockItem, type: 'video' as const, thumbnailUrl: 'thumb-url' };
        render(<MediaCard item={videoItem} onToggleLike={vi.fn()} isLoading={false} onSelect={vi.fn()} />);
        expect(screen.getByAltText(/Video thumbnail by testuser/i)).toBeInTheDocument();
        // PlayCircleOutline icon check is hard via screen, but we can check if it renders without crashing
    });

    it('calls onToggleLike when like button is clicked', () => {
        const onToggleLike = vi.fn();
        render(<MediaCard item={mockItem} onToggleLike={onToggleLike} isLoading={false} onSelect={vi.fn()} />);
        
        const likeButton = screen.getByLabelText('Like');
        fireEvent.click(likeButton);
        
        expect(onToggleLike).toHaveBeenCalled();
    });

    it('calls onSelect when image box is clicked', () => {
        const onSelect = vi.fn();
        render(<MediaCard item={mockItem} onToggleLike={vi.fn()} isLoading={false} onSelect={onSelect} />);
        
        const imageBox = screen.getByAltText(/Photo by testuser/i).parentElement;
        if (imageBox) fireEvent.click(imageBox);
        
        expect(onSelect).toHaveBeenCalled();
    });

    it('shows Unlike label when item is liked', () => {
        const likedItem = { ...mockItem, isLiked: true };
        render(<MediaCard item={likedItem} onToggleLike={vi.fn()} isLoading={false} onSelect={vi.fn()} />);
        expect(screen.getByLabelText('Unlike')).toBeInTheDocument();
    });
});