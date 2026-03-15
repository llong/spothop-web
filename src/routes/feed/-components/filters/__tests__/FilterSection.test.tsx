import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FilterSection } from '../FilterSection';

describe('FilterSection', () => {
    it('renders the title and children correctly', () => {
        const title = 'Test Section';
        
        render(
            <FilterSection title={title}>
                <div data-testid="child-element">Child Content</div>
            </FilterSection>
        );

        expect(screen.getByText(title)).toBeInTheDocument();
        expect(screen.getByTestId('child-element')).toBeInTheDocument();
        expect(screen.getByText('Child Content')).toBeInTheDocument();
    });
});
