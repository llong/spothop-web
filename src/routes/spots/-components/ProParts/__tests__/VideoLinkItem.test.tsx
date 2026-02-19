import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoLinkItem } from '../VideoLinkItem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProfileQuery } from 'src/hooks/useProfileQueries';

vi.mock('src/hooks/useProfileQueries');
vi.mock('src/services/spotService');
vi.mock('../AddVideoLinkDialog', () => ({ AddVideoLinkDialog: () => <div>AddVideoLinkDialog</div> }));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);

describe('VideoLinkItem', () => {
    const mockLink = {
        id: 'l1',
        youtube_video_id: 'vid1',
        start_time: 10,
        skater_name: 'SkaterName',
        author: { username: 'user1' },
        description: 'Test Clip',
        user_id: 'u1',
        spot_id: 's1',
        like_count: 5,
        is_liked_by_user: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useProfileQuery).mockReturnValue({ data: { role: 'user' } } as any);
    });

    it('renders video link details', () => {
        render(<VideoLinkItem link={mockLink as any} onLike={vi.fn()} onDeleteSuccess={vi.fn()} onEditSuccess={vi.fn()} />, { wrapper });
        expect(screen.getByText('Test Clip')).toBeInTheDocument();
        expect(screen.getByText(/Skater: SkaterName/i)).toBeInTheDocument();
        expect(screen.getByText(/Added by @user1/i)).toBeInTheDocument();
    });

    it('opens video modal when thumbnail clicked', () => {
        render(<VideoLinkItem link={mockLink as any} onLike={vi.fn()} onDeleteSuccess={vi.fn()} onEditSuccess={vi.fn()} />, { wrapper });
        fireEvent.click(screen.getByAltText(/Video Thumbnail/i));
        expect(screen.getByTitle(/YouTube video player/i)).toBeInTheDocument();
    });

    it('shows edit/delete menu for owner', () => {
        render(<VideoLinkItem link={mockLink as any} currentUserId="u1" onLike={vi.fn()} onDeleteSuccess={vi.fn()} onEditSuccess={vi.fn()} />, { wrapper });
        expect(screen.getByTestId('MoreVertIcon')).toBeInTheDocument();
    });

    it('hides manage menu for non-owner', () => {
        render(<VideoLinkItem link={mockLink as any} currentUserId="u2" onLike={vi.fn()} onDeleteSuccess={vi.fn()} onEditSuccess={vi.fn()} />, { wrapper });
        expect(screen.queryByTestId('MoreVertIcon')).not.toBeInTheDocument();
    });
});
