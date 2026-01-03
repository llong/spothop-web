import { render, screen, fireEvent } from '@testing-library/react';
import { SpotDetailsForm } from '../SpotDetailsForm';
import { vi, describe, it, expect } from 'vitest';

describe('SpotDetailsForm', () => {
    const defaultProps = {
        name: '',
        setName: vi.fn(),
        description: '',
        setDescription: vi.fn(),
        error: null
    };

    it('renders all fields correctly', () => {
        render(<SpotDetailsForm {...defaultProps} />);
        expect(screen.getByLabelText(/Spot Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    });

    it('calls set functions on change', () => {
        render(<SpotDetailsForm {...defaultProps} />);

        const nameInput = screen.getByLabelText(/Spot Name/i);
        fireEvent.change(nameInput, { target: { value: 'New Name' } });
        expect(defaultProps.setName).toHaveBeenCalledWith('New Name');

        const descInput = screen.getByLabelText(/Description/i);
        fireEvent.change(descInput, { target: { value: 'New Desc' } });
        expect(defaultProps.setDescription).toHaveBeenCalledWith('New Desc');
    });

    it('shows error state when fields are empty and error is present', () => {
        render(<SpotDetailsForm {...defaultProps} error="error" />);
        const nameInput = screen.getByLabelText(/Spot Name/i);
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    });
});
