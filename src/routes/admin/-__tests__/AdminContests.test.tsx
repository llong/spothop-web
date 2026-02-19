import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminContestService } from '@/services/adminContestService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminContestsPage } from '../contests';

vi.mock('@/services/adminContestService', () => ({
    adminContestService: {
        fetchAllContests: vi.fn(),
        deleteContest: vi.fn(),
        createContest: vi.fn(),
        updateContest: vi.fn(),
    }
}));
vi.mock('@/components/ImageUploader', () => ({
    ImageUploader: () => <div data-testid="image-uploader" />
}));
vi.mock('@/components/SearchInput/SearchInput', () => ({
    SearchInput: () => <div data-testid="search-input" />
}));

// Mock TanStack Router
vi.mock('@tanstack/react-router', async () => {
    const actual = await vi.importActual('@tanstack/react-router');
    return {
        ...actual as any,
        useNavigate: () => vi.fn(),
        Link: ({ children }: any) => <div>{children}</div>,
        createFileRoute: () => () => ({
            component: vi.fn(),
        }),
    };
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);

describe('AdminContestsPage', () => {
    const mockContests = [
        {
            id: 'c1',
            title: 'Contest 1',
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date().toISOString(),
            voting_type: 'public',
            criteria: {}
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(adminContestService.fetchAllContests).mockReturnValue(Promise.resolve(mockContests as any));
    });

    it('renders contests table', async () => {
        render(<AdminContestsPage />, { wrapper });

        expect(await screen.findByText('Contest 1')).toBeInTheDocument();
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    it('opens create dialog when New Contest is clicked', async () => {
        render(<AdminContestsPage />, { wrapper });

        fireEvent.click(await screen.findByText(/New Contest/i));
        
        expect(screen.getByText('Create New Contest')).toBeInTheDocument();
    });
});
