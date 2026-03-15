import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterActions } from '../FilterActions';

describe('FilterActions', () => {
    it('renders the reset and apply buttons', () => {
        const onReset = vi.fn();
        const onApply = vi.fn();

        render(<FilterActions onReset={onReset} onApply={onApply} />);

        expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /apply filters/i })).toBeInTheDocument();
    });

    it('calls onReset when the reset button is clicked', () => {
        const onReset = vi.fn();
        const onApply = vi.fn();

        render(<FilterActions onReset={onReset} onApply={onApply} />);

        fireEvent.click(screen.getByRole('button', { name: /reset/i }));
        expect(onReset).toHaveBeenCalledTimes(1);
        expect(onApply).not.toHaveBeenCalled();
    });

    it('calls onApply when the apply button is clicked', () => {
        const onReset = vi.fn();
        const onApply = vi.fn();

        render(<FilterActions onReset={onReset} onApply={onApply} />);

        fireEvent.click(screen.getByRole('button', { name: /apply filters/i }));
        expect(onApply).toHaveBeenCalledTimes(1);
        expect(onReset).not.toHaveBeenCalled();
    });
});
