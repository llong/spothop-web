import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChipFilter } from '../ChipFilter';

describe('ChipFilter', () => {
    it('renders all items', () => {
        const items = ['skatepark', 'street_spot', 'shop'];
        const selectedItems: string[] = [];
        const onToggle = vi.fn();

        render(
            <ChipFilter 
                items={items} 
                selectedItems={selectedItems} 
                onToggle={onToggle} 
            />
        );

        expect(screen.getByText('SKATEPARK')).toBeInTheDocument();
        expect(screen.getByText('STREET SPOT')).toBeInTheDocument();
        expect(screen.getByText('SHOP')).toBeInTheDocument();
    });

    it('highlights selected items correctly', () => {
        const items = ['item_one', 'item_two'];
        const selectedItems = ['item_one'];
        const onToggle = vi.fn();

        render(
            <ChipFilter 
                items={items} 
                selectedItems={selectedItems} 
                onToggle={onToggle} 
            />
        );

        const selectedChip = screen.getByText('ITEM ONE').closest('.MuiChip-root');
        const unselectedChip = screen.getByText('ITEM TWO').closest('.MuiChip-root');

        expect(selectedChip).toHaveClass('MuiChip-colorPrimary');
        expect(selectedChip).toHaveClass('MuiChip-filled');
        
        expect(unselectedChip).toHaveClass('MuiChip-colorDefault');
        expect(unselectedChip).toHaveClass('MuiChip-outlined');
    });

    it('calls onToggle when a chip is clicked', () => {
        const items = ['item_one'];
        const selectedItems: string[] = [];
        const onToggle = vi.fn();

        render(
            <ChipFilter 
                items={items} 
                selectedItems={selectedItems} 
                onToggle={onToggle} 
            />
        );

        fireEvent.click(screen.getByText('ITEM ONE'));
        expect(onToggle).toHaveBeenCalledTimes(1);
        expect(onToggle).toHaveBeenCalledWith('item_one');
    });
});
