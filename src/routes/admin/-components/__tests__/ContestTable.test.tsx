import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContestTable } from '../ContestTable';

describe('ContestTable', () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    
    const mockContests = [
        {
            id: '1',
            title: 'Contest One',
            status: 'active',
            start_date: '2023-01-01T00:00:00.000Z',
            end_date: '2023-12-31T00:00:00.000Z',
            voting_type: 'popular_vote'
        },
        {
            id: '2',
            title: 'Contest Two',
            status: 'draft',
            start_date: '2024-01-01T00:00:00.000Z',
            end_date: '2024-12-31T00:00:00.000Z',
            voting_type: 'judged'
        }
    ] as any[];

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.confirm
        vi.stubGlobal('confirm', vi.fn(() => true));
    });

    it('renders contests in table with correct info', () => {
        render(<ContestTable contests={mockContests} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
        expect(screen.getByText('Contest One')).toBeInTheDocument();
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
        expect(screen.getByText('popular_vote')).toBeInTheDocument();
    });

    it('calls onEdit when edit button is clicked', () => {
        render(<ContestTable contests={mockContests} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
        const editButtons = screen.getAllByTestId('EditIcon');
        fireEvent.click(editButtons[0].parentElement!);
        expect(mockOnEdit).toHaveBeenCalledWith(mockContests[0]);
    });

    it('calls onDelete when delete button is clicked and confirmed', () => {
        render(<ContestTable contests={mockContests} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
        const deleteButtons = screen.getAllByTestId('DeleteIcon');
        fireEvent.click(deleteButtons[0].parentElement!);
        expect(window.confirm).toHaveBeenCalledWith('Delete this contest?');
        expect(mockOnDelete).toHaveBeenCalledWith('1');
    });

    it('does not call onDelete when delete button is clicked but rejected', () => {
        vi.stubGlobal('confirm', vi.fn(() => false));
        render(<ContestTable contests={mockContests} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
        const deleteButtons = screen.getAllByTestId('DeleteIcon');
        fireEvent.click(deleteButtons[0].parentElement!);
        expect(mockOnDelete).not.toHaveBeenCalled();
    });
});
