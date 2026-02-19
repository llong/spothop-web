import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdatePasswordForm } from '../UpdatePasswordForm';
import supabase from '@/supabase';

vi.mock('@/supabase', () => ({
    default: {
        auth: {
            updateUser: vi.fn(),
        },
    }
}));

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => vi.fn(),
}));

describe('UpdatePasswordForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders form fields', () => {
        render(<UpdatePasswordForm />);
        expect(screen.getByLabelText(/^New Password/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Confirm New Password/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Update Password/i })).toBeInTheDocument();
    });

    it('shows error when passwords do not match', async () => {
        render(<UpdatePasswordForm />);
        
        fireEvent.change(screen.getByLabelText(/^New Password/), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/Confirm New Password/), { target: { value: 'password456' } });
        fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

        expect(await screen.findByText(/Passwords don't match/i)).toBeInTheDocument();
    });

    it('calls updateUser on valid submit', async () => {
        vi.mocked(supabase.auth.updateUser).mockResolvedValue({ data: {}, error: null } as any);
        render(<UpdatePasswordForm />);

        fireEvent.change(screen.getByLabelText(/^New Password/), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/Confirm New Password/), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

        expect(supabase.auth.updateUser).toHaveBeenCalledWith({
            password: 'password123'
        });
    });
});
