import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProfileHeader } from '../ProfileHeader';

vi.mock('@tanstack/react-router', () => ({
    Link: ({ children }: any) => <div>{children}</div>
}));

vi.mock('../AvatarUpload', () => ({
    AvatarUpload: () => <div data-testid="avatar-upload" />
}));

describe('ProfileHeader', () => {
    const mockProfile = {
        id: 'u1',
        username: 'testuser',
        displayName: 'Test User',
        avatarUrl: 'avatar-url'
    };

    it('renders profile information', () => {
        render(
            <ProfileHeader
                profile={mockProfile as any}
                formData={mockProfile as any}
                onAvatarUpload={vi.fn()}
                socialStats={{ followerCount: 10, followingCount: 20 }}
            />
        );

        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('@testuser')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('20')).toBeInTheDocument();
        expect(screen.getByTestId('avatar-upload')).toBeInTheDocument();
    });

    it('renders default display name if missing', () => {
        const profileNoName = { ...mockProfile, displayName: '' };
        render(
            <ProfileHeader
                profile={profileNoName as any}
                formData={profileNoName as any}
                onAvatarUpload={vi.fn()}
            />
        );

        expect(screen.getByText('Set Display Name')).toBeInTheDocument();
    });
});
