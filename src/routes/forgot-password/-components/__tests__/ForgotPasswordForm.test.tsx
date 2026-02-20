import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForgotPasswordForm } from '../ForgotPasswordForm';
import supabase from '@/supabase';

vi.mock('@/supabase', () => ({
    default: {
        auth: {
            resetPasswordForEmail: vi.fn(),
        },
    }
}));

describe('ForgotPasswordForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders form fields', () => {
        render(<ForgotPasswordForm />);
        expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send Reset Link/i })).toBeInTheDocument();
    });

    it('calls resetPasswordForEmail on submit', async () => {
        vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({ data: {}, error: null } as any);
        render(<ForgotPasswordForm />);

        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

        expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', expect.any(Object));
        expect(await screen.findByText(/Check your email/i)).toBeInTheDocument();
    });

    it('displays error on failure', async () => {
        vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
            data: null,
            error: { message: 'Reset failed' }
        } as any);
        render(<ForgotPasswordForm />);

        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

        expect(await screen.findByText('Reset failed')).toBeInTheDocument();
    });
});