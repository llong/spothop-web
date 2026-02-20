import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddVideoLinkDialog } from '../AddVideoLinkDialog';
import { spotService } from 'src/services/spotService';

vi.mock('src/services/spotService');
vi.mock('src/utils/youtube', () => ({
    parseYoutubeId: (url: string) => url.includes('youtube') ? 'vid123' : null,
    timeToSeconds: (time: string) => time === '1:00' ? 60 : null,
    secondsToTime: (seconds: number) => seconds === 60 ? '1:00' : '0:00'
}));

describe('AddVideoLinkDialog', () => {
    const defaultProps = {
        open: true,
        onClose: vi.fn(),
        spotId: 's1',
        userId: 'u1',
        onSuccess: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders dialog when open', () => {
        render(<AddVideoLinkDialog {...defaultProps} />);
        expect(screen.getByText('Link Pro Video Part')).toBeInTheDocument();
    });

    it('validates youtube url', async () => {
        render(<AddVideoLinkDialog {...defaultProps} />);
        
        fireEvent.change(screen.getByLabelText(/YouTube URL/i), { target: { value: 'invalid' } });
        fireEvent.change(screen.getByLabelText(/Start Time/i), { target: { value: '1:00' } });
        fireEvent.click(screen.getByText('Add Link'));

        expect(await screen.findByText('Invalid YouTube URL')).toBeInTheDocument();
    });

    it('validates start time', async () => {
        render(<AddVideoLinkDialog {...defaultProps} />);
        
        fireEvent.change(screen.getByLabelText(/YouTube URL/i), { target: { value: 'https://youtube.com/watch?v=vid123' } });
        fireEvent.change(screen.getByLabelText(/Start Time/i), { target: { value: 'invalid' } });
        fireEvent.click(screen.getByText('Add Link'));

        expect(await screen.findByText(/Invalid Start Time/i)).toBeInTheDocument();
    });

    it('calls addVideoLink on valid submit', async () => {
        render(<AddVideoLinkDialog {...defaultProps} />);
        
        fireEvent.change(screen.getByLabelText(/YouTube URL/i), { target: { value: 'https://youtube.com/watch?v=vid123' } });
        fireEvent.change(screen.getByLabelText(/Start Time/i), { target: { value: '1:00' } });
        
        const addButton = screen.getByText('Add Link');
        await waitFor(() => expect(addButton).not.toBeDisabled());
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(spotService.addVideoLink).toHaveBeenCalledWith(
                's1', 'u1', 'vid123', 60, undefined, '', ''
            );
            expect(defaultProps.onSuccess).toHaveBeenCalled();
        });
    });

    it('pre-fills data when editing', () => {
        const editLink = {
            id: 'l1',
            youtube_video_id: 'vid123',
            start_time: 60,
            skater_name: 'Tony',
            description: 'Kickflip',
            user_id: 'u1',
            spot_id: 's1',
            like_count: 0,
            is_liked_by_user: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        render(<AddVideoLinkDialog {...defaultProps} editLink={editLink} />);
        
        expect(screen.getByDisplayValue(/vid123/)).toBeInTheDocument();
        expect(screen.getByDisplayValue('1:00')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Tony')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Kickflip')).toBeInTheDocument();
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
});