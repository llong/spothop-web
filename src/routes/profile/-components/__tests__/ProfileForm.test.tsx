import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileForm } from '../ProfileForm';

describe('ProfileForm', () => {
    const mockOnSubmit = vi.fn((e) => e.preventDefault());
    const mockOnFormChange = vi.fn();
    const mockOnSignOut = vi.fn();
    const defaultFormData = {
        displayName: 'John Doe',
        city: 'San Francisco',
        country: 'USA',
        bio: 'Hello world',
        riderType: 'skateboard',
        instagramHandle: 'johndoe'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders form fields with formData values', () => {
        render(
            <ProfileForm 
                formData={defaultFormData} 
                onFormChange={mockOnFormChange} 
                onSubmit={mockOnSubmit} 
                onSignOut={mockOnSignOut}
                isUpdating={false} 
            />
        );
        
        expect(screen.getByLabelText(/display name/i)).toHaveValue('John Doe');
        expect(screen.getByLabelText(/city/i)).toHaveValue('San Francisco');
        expect(screen.getByLabelText(/bio/i)).toHaveValue('Hello world');
        expect(screen.getByLabelText(/instagram handle/i)).toHaveValue('johndoe');
    });

    it('calls onFormChange when inputs change', () => {
        render(
            <ProfileForm 
                formData={defaultFormData} 
                onFormChange={mockOnFormChange} 
                onSubmit={mockOnSubmit} 
                onSignOut={mockOnSignOut}
                isUpdating={false} 
            />
        );
        
        const nameInput = screen.getByLabelText(/display name/i);
        fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
        expect(mockOnFormChange).toHaveBeenCalled();
    });

    it('calls onSubmit when form is submitted', () => {
        render(
            <ProfileForm 
                formData={defaultFormData} 
                onFormChange={mockOnFormChange} 
                onSubmit={mockOnSubmit} 
                onSignOut={mockOnSignOut}
                isUpdating={false} 
            />
        );
        
        fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
        expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('calls onSignOut when sign out button clicked', () => {
        render(
            <ProfileForm 
                formData={defaultFormData} 
                onFormChange={mockOnFormChange} 
                onSubmit={mockOnSubmit} 
                onSignOut={mockOnSignOut}
                isUpdating={false} 
            />
        );
        
        fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
        expect(mockOnSignOut).toHaveBeenCalled();
    });

    it('disables submit button when isUpdating is true', () => {
        render(
            <ProfileForm 
                formData={defaultFormData} 
                onFormChange={mockOnFormChange} 
                onSubmit={mockOnSubmit} 
                onSignOut={mockOnSignOut}
                isUpdating={true} 
            />
        );
        
        const submitButton = screen.getByRole('button', { name: /update profile/i });
        expect(submitButton).toBeDisabled();
    });
});
