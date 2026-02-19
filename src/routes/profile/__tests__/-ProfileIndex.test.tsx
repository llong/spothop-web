import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileComponent } from '../index.lazy';
import { useAtomValue } from 'jotai';
import { useProfileQuery, useSocialStatsQuery, useUserContentQuery } from 'src/hooks/useProfileQueries';
import { useProfileManagement } from 'src/hooks/useProfileManagement';

vi.mock('jotai', async () => {
    const actual = await vi.importActual('jotai');
    return {
        ...actual as any,
        useAtomValue: vi.fn(),
    };
});

vi.mock('src/hooks/useProfileQueries');
vi.mock('src/hooks/useProfileManagement');

vi.mock('../-components/ProfileHeader', () => ({ ProfileHeader: () => <div>ProfileHeader</div> }));
vi.mock('../-components/ProfileForm', () => ({ ProfileForm: () => <div>ProfileForm</div> }));
vi.mock('../-components/FavoriteSpots', () => ({ FavoriteSpots: () => <div>FavoriteSpots</div> }));
vi.mock('../-components/LikedMediaGallery', () => ({ LikedMediaGallery: () => <div>LikedMediaGallery</div> }));
vi.mock('../-components/UserContentGallery', () => ({ UserContentGallery: () => <div>UserContentGallery</div> }));

describe('ProfileComponent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAtomValue).mockReturnValue({ user: { id: 'u1' } });
        vi.mocked(useProfileManagement).mockReturnValue({
            updateProfile: vi.fn(),
            handleSignOut: vi.fn(),
            createHandleFormChange: vi.fn(() => vi.fn()),
            isUpdating: false
        } as any);
        vi.mocked(useProfileQuery).mockReturnValue({ data: { displayName: 'Test' }, isLoading: false } as any);
        vi.mocked(useSocialStatsQuery).mockReturnValue({ data: {}, isLoading: false } as any);
        vi.mocked(useUserContentQuery).mockReturnValue({ data: {}, isLoading: false } as any);
    });

    it('renders loading state', () => {
        vi.mocked(useProfileQuery).mockReturnValue({ isLoading: true } as any);
        render(<ProfileComponent />);
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders profile components', () => {
        render(<ProfileComponent />);
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('ProfileHeader')).toBeInTheDocument();
        expect(screen.getByText('ProfileForm')).toBeInTheDocument();
        expect(screen.getByText('FavoriteSpots')).toBeInTheDocument();
    });
});
