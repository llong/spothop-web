import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginForm } from '../LoginForm';
import supabase from '@/supabase';
import { useAtomValue } from 'jotai';

vi.mock('@/supabase', () => ({
    default: {
        auth: {
            signInWithPassword: vi.fn(),
        },
    }
}));

vi.mock('jotai', async () => {
    const actual = await vi.importActual('jotai');
    return {
        ...actual as any,
        useAtomValue: vi.fn(),
    };
});

vi.mock('@tanstack/react-router', () => ({
    Link: ({ children }: any) => <div>{children}</div>,
    useNavigate: () => vi.fn(),
    useSearch: () => ({}),
}));

describe('LoginForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAtomValue).mockReturnValue(null);
    });

    it('renders login form fields', () => {
        render(<LoginForm />);
        expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    it('calls signInWithPassword on submit', async () => {
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: {}, error: null } as any);
        render(<LoginForm />);

        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123'
        });
    });

    it('displays error message on failure', async () => {
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ 
            data: null, 
            error: { message: 'Invalid credentials' } 
        } as any);
        render(<LoginForm />);

        fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

        expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    });
});
