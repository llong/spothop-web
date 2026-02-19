import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SpotSocialActions } from '../SpotSocialActions';

describe('SpotSocialActions', () => {
    it('renders social buttons', () => {
        render(<SpotSocialActions isLoggedIn={true} isFavorited={false} favoriteCount={0} flagCount={0} onToggleFavorite={() => {}} onReportClick={() => {}} onShareClick={() => {}} />);
        
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBe(3);
    });

    it('displays counts when provided', () => {
        render(<SpotSocialActions isLoggedIn={true} isFavorited={true} favoriteCount={5} flagCount={2} onToggleFavorite={() => {}} onReportClick={() => {}} onShareClick={() => {}} />);
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });
});
