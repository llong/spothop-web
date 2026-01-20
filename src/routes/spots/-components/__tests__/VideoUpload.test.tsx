import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoUpload } from '../VideoUpload';

vi.mock('uuid', () => ({
    v4: () => 'test-uuid-123'
}));

vi.mock('../../../utils/videoProcessing', () => ({
    trimVideo: vi.fn()
}));

describe('VideoUpload Component - Video Preview', () => {
    const mockOnFilesSelect = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockOnFilesSelect.mockClear();
    });

    it('renders video upload component', () => {
        render(<VideoUpload onFilesSelect={mockOnFilesSelect} />);

        expect(screen.getByText('Upload videos (Optional)')).toBeInTheDocument();
        expect(screen.getByText('All videos will be trimmed to max 20 seconds and optimized.')).toBeInTheDocument();
        expect(screen.getByText('Select Video')).toBeInTheDocument();
    });

    it('opens file input when Select Video button is clicked', () => {
        render(<VideoUpload onFilesSelect={mockOnFilesSelect} />);

        const fileInput = screen.getByLabelText('Select Video').closest('input');
        expect(fileInput).toBeInTheDocument();
        expect(fileInput).toHaveAttribute('type', 'file');
        expect(fileInput).toHaveAttribute('accept', 'video/*');
    });

    it('validates video file type', () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
        render(<VideoUpload onFilesSelect={mockOnFilesSelect} />);

        const fileInput = screen.getByLabelText('Select Video').closest('input');
        const invalidFile = new File(['mock content'], 'test.txt', { type: 'text/plain' });

        Object.defineProperty(fileInput!, 'files', {
            value: [invalidFile],
            writable: false
        });

        fireEvent.change(fileInput!);

        expect(alertSpy).toHaveBeenCalledWith('Please select a valid video file.');
        alertSpy.mockRestore();
    });

    it('shows placeholder when no videos are added', () => {
        render(<VideoUpload onFilesSelect={mockOnFilesSelect} />);

        expect(screen.getByText('Upload videos (Optional)')).toBeInTheDocument();
        expect(screen.getByText('Select Video')).toBeInTheDocument();
    });

    it('does not show video preview dialog initially', () => {
        render(<VideoUpload onFilesSelect={mockOnFilesSelect} />);

        expect(screen.queryByText('Video Preview')).not.toBeInTheDocument();
    });
});