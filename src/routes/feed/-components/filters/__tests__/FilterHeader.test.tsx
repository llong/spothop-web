import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterHeader } from '../FilterHeader';

describe('FilterHeader', () => {
    it('renders the header correctly', () => {
        const onClose = vi.fn();
        render(<FilterHeader onClose={onClose} />);

        expect(screen.getByText('Feed Filters')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument(); // Close button
    });

    it('calls onClose when the close button is clicked', () => {
        const onClose = vi.fn();
        render(<FilterHeader onClose={onClose} />);

        fireEvent.click(screen.getByRole('button'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
