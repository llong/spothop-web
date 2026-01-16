import { render, screen, fireEvent } from '@testing-library/react';
import { AdminDashboard } from '../index.lazy';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { useAdminQueries } from '../../../hooks/useAdminQueries';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hook
vi.mock('../../../hooks/useAdminQueries', () => ({
    useAdminQueries: vi.fn()
}));

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

describe('AdminDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders report queue by default', () => {
        const mockReports = [
            {
                id: 'r1',
                target_type: 'spot',
                reason: 'Spam',
                created_at: new Date().toISOString(),
                reporter: { username: 'user1' },
                target_content: { name: 'Bad Spot', address: '123 St' }
            }
        ];

        (useAdminQueries as any).mockReturnValue({
            reports: mockReports,
            isLoadingReports: false,
            reportsError: null,
            resolveReport: vi.fn(),
            deleteContent: vi.fn(),
            toggleBan: vi.fn(),
            isActioning: false
        });

        render(<AdminDashboard />, { wrapper: createWrapper() });

        expect(screen.getByText(/Moderation Queue/i)).toBeInTheDocument();
        expect(screen.getByText(/Bad Spot/i)).toBeInTheDocument();
        expect(screen.getByText(/Spam/i)).toBeInTheDocument();
    });

    it('switches to user management tab', () => {
        (useAdminQueries as any).mockReturnValue({
            reports: [],
            isLoadingReports: false,
            reportsError: null,
            resolveReport: vi.fn(),
            deleteContent: vi.fn(),
            toggleBan: vi.fn(),
            isActioning: false
        });

        render(<AdminDashboard />, { wrapper: createWrapper() });

        const userTab = screen.getByRole('tab', { name: /User Management/i });
        fireEvent.click(userTab);

        expect(screen.getByLabelText(/Search users/i)).toBeInTheDocument();
    });
});
