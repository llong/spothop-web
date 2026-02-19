import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WelcomeComponent } from '../index';
import { useAtomValue, useSetAtom } from 'jotai';
import supabase from 'src/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('jotai', async () => {
    const actual = await vi.importActual('jotai');
    return {
        ...actual as any,
        useAtomValue: vi.fn(),
        useSetAtom: vi.fn(),
    };
});
vi.mock('src/supabase', () => ({
    default: {
        from: vi.fn(),
        auth: {
            getSession: vi.fn(),
        },
    }
}));
vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => vi.fn(),
    createFileRoute: () => () => ({ component: vi.fn() }),
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);

describe('WelcomeComponent', () => {
    const mockUser = { user: { id: 'u1', email: 'test@example.com' } };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAtomValue).mockReturnValue(mockUser);
        vi.mocked(useSetAtom).mockReturnValue(vi.fn());
    });

    it('renders step 1 and pre-populates from email', () => {
        render(<WelcomeComponent />, { wrapper });

        expect(screen.getByLabelText(/Username/i)).toHaveValue('test');
        expect(screen.getByLabelText(/Display Name/i)).toHaveValue('test');
    });

    it('moves to step 2 after validation', async () => {
        render(<WelcomeComponent />, { wrapper });

        // Mock username availability check
        vi.mocked(supabase.from).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any);

        fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'newuser' } });
        
        // Wait for debounce and async check
        await waitFor(() => {
            expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText(/Display Name/i), { target: { value: 'New User' } });
        
        // Material UI Select handle
        fireEvent.mouseDown(screen.getByLabelText(/What do you ride/i));
        fireEvent.click(screen.getByText('Skateboard'));

        const continueBtn = screen.getByRole('button', { name: /Continue/i });
        expect(continueBtn).not.toBeDisabled();
        fireEvent.click(continueBtn);

        expect(await screen.findByText(/App Features/i)).toBeInTheDocument();
    });
});
