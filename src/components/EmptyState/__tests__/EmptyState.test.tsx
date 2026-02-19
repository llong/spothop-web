import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmptyState } from '../EmptyState';
import { Add as AddIcon } from '@mui/icons-material';

describe('EmptyState', () => {
    const onCtaPress = vi.fn();

    it('renders message and subtitle', () => {
        render(<EmptyState message="No data" subtitle="Please check back later" />);
        expect(screen.getByText('No data')).toBeInTheDocument();
        expect(screen.getByText('Please check back later')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
        render(<EmptyState message="No data" icon={AddIcon} />);
        expect(screen.getByTestId('AddIcon')).toBeInTheDocument();
    });

    it('renders CTA button and handles click', () => {
        render(<EmptyState message="No data" ctaText="Add New" onCtaPress={onCtaPress} />);
        const button = screen.getByText('Add New');
        fireEvent.click(button);
        expect(onCtaPress).toHaveBeenCalled();
    });

    it('does not render CTA if text or handler is missing', () => {
        render(<EmptyState message="No data" />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
