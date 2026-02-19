import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UserStats } from '../UserStats';
import { useSocialStatsQuery } from 'src/hooks/useProfileQueries';

vi.mock('src/hooks/useProfileQueries');

describe('UserStats', () => {
    it('renders loading state', () => {
        vi.mocked(useSocialStatsQuery).mockReturnValue({
            isLoading: true
        } as any);

        render(<UserStats userId="u1" />);
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders follower and following counts', () => {
        vi.mocked(useSocialStatsQuery).mockReturnValue({
            data: { followerCount: 10, followingCount: 20 },
            isLoading: false
        } as any);

        render(<UserStats userId="u1" />);
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('Followers')).toBeInTheDocument();
        expect(screen.getByText('20')).toBeInTheDocument();
        expect(screen.getByText('Following')).toBeInTheDocument();
    });

    it('renders zero when stats are missing', () => {
        vi.mocked(useSocialStatsQuery).mockReturnValue({
            data: null,
            isLoading: false
        } as any);

        render(<UserStats userId="u1" />);
        const zeros = screen.getAllByText('0');
        expect(zeros).toHaveLength(2);
    });
});
