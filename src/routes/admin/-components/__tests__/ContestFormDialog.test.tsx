import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContestFormDialog } from '../ContestFormDialog';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useContestForm } from '../../hooks/-useContestForm';

vi.mock('../../hooks/-useContestForm', () => ({
    useContestForm: vi.fn(),
}));

// Mock ImageUploader
vi.mock('@/components/ImageUploader', () => ({
    ImageUploader: () => <div data-testid="image-uploader" />
}));

describe('ContestFormDialog', () => {
    const mockOnClose = vi.fn();
    const mockSaveContest = vi.fn();
    const mockHandleChange = vi.fn();
    const mockHandleCriteriaChange = vi.fn();

    const defaultMockReturn = {
        formData: { title: '', status: 'draft', voting_type: 'public', criteria: {} },
        setFlyerFile: vi.fn(),
        judgeSearchResults: [],
        selectedJudges: [],
        radiusUnit: 'miles',
        setRadiusUnit: vi.fn(),
        handleChange: mockHandleChange,
        handleCriteriaChange: mockHandleCriteriaChange,
        debouncedJudgeSearch: vi.fn(),
        saveContest: mockSaveContest,
        isSaving: false,
        setSelectedJudges: vi.fn()
    };

    const renderDialog = (props = {}) => {
        return render(
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <ContestFormDialog
                    open={true}
                    onClose={mockOnClose}
                    contest={null}
                    {...props}
                />
            </LocalizationProvider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useContestForm as any).mockReturnValue(defaultMockReturn);
    });

    it('renders create contest dialog', () => {
        renderDialog();
        expect(screen.getByText(/create new contest/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save contest/i })).toBeInTheDocument();
    });

    it('renders edit contest dialog', () => {
        const contest = { id: '1', title: 'Edit Me' } as any;
        (useContestForm as any).mockReturnValue({
            ...defaultMockReturn,
            formData: contest
        });
        renderDialog({ contest });
        expect(screen.getByText(/edit contest/i)).toBeInTheDocument();
    });

    it('handles close/cancel', () => {
        renderDialog();
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls saveContest on submit', () => {
        renderDialog();
        fireEvent.click(screen.getByRole('button', { name: /save contest/i }));
        expect(mockSaveContest).toHaveBeenCalled();
    });
});
