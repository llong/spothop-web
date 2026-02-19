import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BottomNav } from '../BottomNav';
import { useAtomValue } from 'jotai';

vi.mock('jotai', async () => {
    const actual = await vi.importActual('jotai');
    return {
        ...actual as any,
        useAtomValue: vi.fn(),
    };
});

vi.mock('@tanstack/react-router', () => ({
    Link: ({ children }: any) => <div>{children}</div>,
    useLocation: () => ({ pathname: '/feed' }),
}));

describe('BottomNav', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders basic items when not authenticated', () => {
        vi.mocked(useAtomValue).mockReturnValue(null);
        render(<BottomNav />);
        
        expect(screen.getByText('Feed')).toBeInTheDocument();
        expect(screen.getByText('Spots')).toBeInTheDocument();
        expect(screen.getByText('Sign In')).toBeInTheDocument();
        expect(screen.queryByText('Inbox')).not.toBeInTheDocument();
    });

    it('renders extra items when authenticated', () => {
        vi.mocked(useAtomValue).mockReturnValue({ user: { id: 'u1' } });
        render(<BottomNav />);
        
        expect(screen.getByText('Inbox')).toBeInTheDocument();
        expect(screen.getByText('Alerts')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
    });
});
