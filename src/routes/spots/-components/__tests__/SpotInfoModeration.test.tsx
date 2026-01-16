import { render, screen, fireEvent } from '@testing-library/react';
import { SpotInfo } from '../SpotInfo/SpotInfo';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { useProfileQuery } from 'src/hooks/useProfileQueries';
import { useAdminQueries } from 'src/hooks/useAdminQueries';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('src/hooks/useProfileQueries', () => ({
    useProfileQuery: vi.fn()
}));

vi.mock('src/hooks/useAdminQueries', () => ({
    useAdminQueries: vi.fn()
}));

vi.mock('src/hooks/useSpotAddress', () => ({
    useSpotAddress: () => ({ displayAddress: '123 Test St' })
}));

vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useAtomValue: () => ({ user: { id: 'admin-id' } })
    }
});

vi.mock('@tanstack/react-router', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useNavigate: () => vi.fn(),
        Link: ({ children, to }: any) => <a href={to}>{children}</a>
    }
});

const createWrapper = () => {
    const queryClient = new QueryClient();
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe('SpotInfo Moderation', () => {
    const mockSpot = {
        id: 's1',
        name: 'Test Spot',
        kickout_risk: 1,
        difficulty: 'beginner',
        is_lit: true
    } as any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows delete button for admins', () => {
        vi.mocked(useProfileQuery).mockReturnValue({ data: { role: 'admin' } } as any);
        vi.mocked(useAdminQueries).mockReturnValue({ deleteContent: vi.fn(), isActioning: false } as any);

        render(<SpotInfo spot={mockSpot} isFavorited={false} onToggleFavorite={() => { }} isLoggedIn={true} onReportSuccess={() => { }} />, {
            wrapper: createWrapper()
        });

        expect(screen.getByText(/Delete Spot/i)).toBeInTheDocument();
    });

    it('hides delete button for regular users', () => {
        vi.mocked(useProfileQuery).mockReturnValue({ data: { role: 'user' } } as any);
        vi.mocked(useAdminQueries).mockReturnValue({ deleteContent: vi.fn(), isActioning: false } as any);

        render(<SpotInfo spot={mockSpot} isFavorited={false} onToggleFavorite={() => { }} isLoggedIn={true} onReportSuccess={() => { }} />, {
            wrapper: createWrapper()
        });

        expect(screen.queryByText(/Delete Spot/i)).not.toBeInTheDocument();
    });

    it('calls deleteContent when admin clicks delete', async () => {
        const mockDelete = vi.fn().mockResolvedValue(undefined);
        vi.mocked(useProfileQuery).mockReturnValue({ data: { role: 'admin' } } as any);
        vi.mocked(useAdminQueries).mockReturnValue({ deleteContent: mockDelete, isActioning: false } as any);

        // Mock window.confirm
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(<SpotInfo spot={mockSpot} isFavorited={false} onToggleFavorite={() => { }} isLoggedIn={true} onReportSuccess={() => { }} />, {
            wrapper: createWrapper()
        });

        const deleteBtn = screen.getByText(/Delete Spot/i);
        fireEvent.click(deleteBtn);

        expect(confirmSpy).toHaveBeenCalled();
        expect(mockDelete).toHaveBeenCalledWith({ type: 'spot', id: mockSpot.id });
    });
});
