import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MapSearchAreaButton } from './MapSearchAreaButton';

describe('MapSearchAreaButton', () => {
    it('renders when visible', () => {
        const onClick = vi.fn();
        render(<MapSearchAreaButton visible={true} onClick={onClick} />);

        expect(screen.getByText('Search this area')).toBeInTheDocument();
    });

    it('does not render when not visible', () => {
        const onClick = vi.fn();
        render(<MapSearchAreaButton visible={false} onClick={onClick} />);

        expect(screen.queryByText('Search this area')).not.toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const onClick = vi.fn();
        render(<MapSearchAreaButton visible={true} onClick={onClick} />);

        fireEvent.click(screen.getByText('Search this area'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
