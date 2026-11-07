import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileComponent } from '@/routes/profile/index.lazy';
import { useAtomValue } from 'jotai';
import { useProfileQuery, useSocialStatsQuery, useUserContentQuery } from '@/hooks/useProfileQueries';
import { useProfileManagement } from '@/hooks/useProfileManagement';

vi.mock('jotai', async () => {
    const actual = await vi.importActual('jotai');
    return {
        ...actual as any,
        atom: actual.atom,
        useAtomValue: vi.fn(),
        useSetAtom: vi.fn(),
    };
});

vi.mock('@/hooks/useProfileQueries');
vi.mock('@/hooks/useProfileManagement');

vi.mock('@/routes/profile/-components/ProfileHeader', () => ({ ProfileHeader: () => <div>ProfileHeader</div> }));
vi.mock('@/routes/profile/-components/ProfileForm', () => ({ ProfileForm: () => <div>ProfileForm</div> }));
vi.mock('@/routes/profile/-components/FavoriteSpots', () => ({ FavoriteSpots: () => <div>FavoriteSpots</div> }));
vi.mock('@/routes/profile/-components/LikedMediaGallery', () => ({ LikedMediaGallery: () => <div>LikedMediaGallery</div> }));
vi.mock('@/routes/profile/-components/UserContentGallery', () => ({ UserContentGallery: () => <div>UserContentGallery</div> }));

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