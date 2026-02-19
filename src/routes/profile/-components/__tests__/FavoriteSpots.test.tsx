import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FavoriteSpots } from '../FavoriteSpots';

vi.mock('@tanstack/react-router', () => ({
    Link: ({ children }: any) => <div>{children}</div>
}));

describe('FavoriteSpots', () => {
    it('renders empty state', () => {
        render(<FavoriteSpots favoriteSpots={[]} />);
        expect(screen.getByText('No favorite spots yet.')).toBeInTheDocument();
    });

    it('renders list of favorite spots', () => {
        const mockSpots = [
            { id: 's1', name: 'Spot 1', address: 'Address 1', photoUrl: 'url1' },
            { id: 's2', name: 'Spot 2', address: 'Address 2', photoUrl: 'url2' }
        ];

        render(<FavoriteSpots favoriteSpots={mockSpots as any} />);
        
        expect(screen.getByText('Spot 1')).toBeInTheDocument();
        expect(screen.getByText('Address 1')).toBeInTheDocument();
        expect(screen.getByText('Spot 2')).toBeInTheDocument();
        expect(screen.getByText('Address 2')).toBeInTheDocument();
    });
});
