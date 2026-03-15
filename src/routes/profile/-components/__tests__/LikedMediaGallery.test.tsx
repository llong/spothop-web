import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LikedMediaGallery } from '../LikedMediaGallery';

// Mock tanstack router Link
vi.mock('@tanstack/react-router', () => ({
    Link: ({ children }: any) => <div>{children}</div>
}));

describe('LikedMediaGallery', () => {
    const mockMedia = [
        { 
            id: '1', 
            url: 'img1.jpg', 
            type: 'photo' as const,
            spot: { id: 's1', name: 'Spot One' },
            author: { username: 'user1', avatarUrl: null }
        },
        { 
            id: '2', 
            url: 'vid1.mp4', 
            thumbnailUrl: 'thumb1.jpg',
            type: 'video' as const,
            spot: { id: 's2', name: 'Spot Two' },
            author: { username: 'user2', avatarUrl: null }
        }
    ] as any[];

    it('renders empty state when no media', () => {
        render(<LikedMediaGallery likedMedia={[]} loadingMedia={false} />);
        expect(screen.getByText(/no liked media yet/i)).toBeInTheDocument();
    });

    it('renders list of media items', () => {
        render(<LikedMediaGallery likedMedia={mockMedia} loadingMedia={false} />);
        
        expect(screen.getByText('Spot One')).toBeInTheDocument();
        expect(screen.getByText('Spot Two')).toBeInTheDocument();
        expect(screen.getByText('@user1')).toBeInTheDocument();
        expect(screen.getByText('@user2')).toBeInTheDocument();
    });

    it('renders loading state', () => {
        render(<LikedMediaGallery likedMedia={[]} loadingMedia={true} />);
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
});
