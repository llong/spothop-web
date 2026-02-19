import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchInput } from '../SearchInput';

describe('SearchInput', () => {
    it('calls onSearch with parsed coordinates when Enter is pressed', () => {
        const onSearch = vi.fn();
        render(<SearchInput onSearch={onSearch} />);
        
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: '10, 20' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        
        expect(onSearch).toHaveBeenCalledWith('10, 20', { lat: 10, lng: 20 });
    });

    it('calls onSearch with undefined location for invalid input', () => {
        const onSearch = vi.fn();
        render(<SearchInput onSearch={onSearch} />);
        
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'not-coords' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        
        expect(onSearch).toHaveBeenCalledWith('not-coords', undefined);
    });
});
