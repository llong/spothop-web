import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProPartsTab } from '../ProPartsTab';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('src/services/spotService');
vi.mock('./VideoLinkItem', () => ({ VideoLinkItem: () => <div>VideoLinkItem</div> }));
vi.mock('./AddVideoLinkDialog', () => ({ AddVideoLinkDialog: () => <div>AddVideoLinkDialog</div> }));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);

describe('ProPartsTab', () => {
    const mockSpot = {
        id: 's1',
        videoLinks: []
    };

    it('renders empty state', () => {
        render(<ProPartsTab spot={mockSpot as any} />, { wrapper });
        expect(screen.getByText(/No pro video parts linked yet/i)).toBeInTheDocument();
    });

    it('renders links when present', () => {
        const spotWithLinks = {
            ...mockSpot,
            videoLinks: [{
                id: 'l1',
                youtube_video_id: 'vid1',
                start_time: 0,
                skater_name: 'SkaterName',
                author: { username: 'user' }
            }]
        };
        render(<ProPartsTab spot={spotWithLinks as any} />, { wrapper });
        expect(screen.getByText(/SkaterName/i)).toBeInTheDocument();
    });

    it('opens add dialog when button clicked', async () => {
        render(<ProPartsTab spot={mockSpot as any} currentUserId="u1" />, { wrapper });
        fireEvent.click(screen.getByText(/Add Pro Clip/i));
        expect(await screen.findByText(/Link Pro Video Part/i)).toBeInTheDocument();
    });

    it('disables add button when not authenticated', () => {
        render(<ProPartsTab spot={mockSpot as any} />, { wrapper });
        expect(screen.getByText(/Add Pro Clip/i)).toBeDisabled();
    });
});