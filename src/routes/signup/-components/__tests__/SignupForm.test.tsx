import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignupForm } from '../SignupForm';
import supabase from 'src/supabase';

vi.mock('src/supabase', () => ({
    default: {
        auth: {
            signUp: vi.fn(),
        },
    }
}));

vi.mock('@tanstack/react-router', () => ({
    Link: ({ children }: any) => <div>{children}</div>
}));

describe('SignupForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders signup form fields', () => {
        render(<SignupForm />);
        expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
        expect(screen.getByText(/I agree to the/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
    });

    it('shows error when passwords do not match', async () => {
        render(<SignupForm />);
        
        fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password456' } });
        fireEvent.blur(screen.getByLabelText(/Confirm Password/i));

        expect(await screen.findByText(/Passwords don't match/i)).toBeInTheDocument();
    });

    it('calls signUp on valid submit', async () => {
        vi.mocked(supabase.auth.signUp).mockResolvedValue({ data: { user: {} }, error: null } as any);
        render(<SignupForm />);

        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });
        
        // Use container to find the checkbox if needed, or by role
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
        
        const signUpButton = await screen.findByRole('button', { name: /Sign Up/i });
        // Wait for isValid to become true
        await waitFor(() => expect(signUpButton).not.toBeDisabled());
        
        fireEvent.click(signUpButton);

        await waitFor(() => {
            expect(supabase.auth.signUp).toHaveBeenCalled();
        }, { timeout: 2000 });
        expect(await screen.findByText(/Check your email/i)).toBeInTheDocument();
    });
});
