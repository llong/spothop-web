import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ContestStatusVotingFields } from '../ContestStatusVotingFields';

describe('ContestStatusVotingFields', () => {
    const mockOnChange = vi.fn();
    const mockOnJudgesChange = vi.fn();
    const mockOnJudgeSearch = vi.fn();
    
    const defaultFormData = {
        status: 'draft' as const,
        voting_type: 'public' as const,
    };

    const renderComponent = (props = {}) => {
        return render(
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <ContestStatusVotingFields
                    formData={defaultFormData}
                    onChange={mockOnChange}
                    judgeSearchResults={[]}
                    selectedJudges={[]}
                    onJudgesChange={mockOnJudgesChange}
                    onJudgeSearch={mockOnJudgeSearch}
                    {...props}
                />
            </LocalizationProvider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders status and voting type fields', () => {
        renderComponent();
        expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/voting type/i)).toBeInTheDocument();
    });

    it('handles status change', () => {
        renderComponent();
        const statusSelect = screen.getByLabelText(/status/i);
        fireEvent.mouseDown(statusSelect);
        fireEvent.click(screen.getByText(/active/i));
        // MUI select triggers onChange with a synthesized event
        expect(mockOnChange).toHaveBeenCalled();
        const event = mockOnChange.mock.calls[0][0];
        expect(event.target.name).toBe('status');
        expect(event.target.value).toBe('active');
    });

    it('handles voting type change', () => {
        renderComponent();
        const votingTypeSelect = screen.getByLabelText(/voting type/i);
        fireEvent.mouseDown(votingTypeSelect);
        fireEvent.click(screen.getByText(/selected judges/i));
        expect(mockOnChange).toHaveBeenCalled();
    });

    it('renders judge selection when voting type is judges', () => {
        renderComponent({ 
            formData: { ...defaultFormData, voting_type: 'judges' } 
        });
        expect(screen.getByLabelText(/select judges/i)).toBeInTheDocument();
    });
});
