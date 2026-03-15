import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OptimizedImage } from '../OptimizedImage';

describe('OptimizedImage', () => {
    it('renders without crashing', () => {
        render(<OptimizedImage src="test.jpg" alt="test image" />);
        expect(screen.getByAltText('test image')).toBeInTheDocument();
    });

    it('renders fallback when no src is provided', () => {
        render(<OptimizedImage src="" alt="test image" />);
        expect(screen.getByTestId('ImageNotSupportedIcon')).toBeInTheDocument();
    });

    it('handles image load', () => {
        render(<OptimizedImage src="test.jpg" alt="test image" />);
        const img = screen.getByAltText('test image');
        fireEvent.load(img);
        expect(img).toHaveStyle({ opacity: '1' });
    });

    it('handles image error', () => {
        render(<OptimizedImage src="test.jpg" alt="test image" />);
        const img = screen.getByAltText('test image');
        fireEvent.error(img);
        expect(screen.getByTestId('ImageNotSupportedIcon')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const handleClick = vi.fn();
        render(<OptimizedImage src="test.jpg" alt="test image" onClick={handleClick} />);
        const container = screen.getByAltText('test image').parentElement;
        if (container) {
            fireEvent.click(container);
            expect(handleClick).toHaveBeenCalledTimes(1);
        }
    });
});
