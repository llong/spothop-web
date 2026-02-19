import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsComponent } from '../index';
import { useNotifications } from 'src/hooks/useNotifications';

vi.mock('src/hooks/useNotifications');
vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => vi.fn(),
    createFileRoute: () => () => ({ component: vi.fn() }),
}));

describe('NotificationsComponent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useNotifications).mockReturnValue({
            notifications: [],
            loading: false,
            markAsRead: vi.fn(),
            deleteNotification: vi.fn(),
            markAllAsRead: vi.fn(),
        } as any);
    });

    it('renders empty state', () => {
        render(<NotificationsComponent />);
        expect(screen.getByText(/You don't have any notifications yet/i)).toBeInTheDocument();
    });

    it('renders loading state', () => {
        vi.mocked(useNotifications).mockReturnValue({
            notifications: [],
            loading: true,
        } as any);
        render(<NotificationsComponent />);
        expect(screen.getByText(/Loading notifications/i)).toBeInTheDocument();
    });

    it('renders notifications list', () => {
        const mockNotifications = [
            { id: 'n1', type: 'comment', actor: { username: 'user1' }, created_at: new Date().toISOString(), is_read: false }
        ];
        vi.mocked(useNotifications).mockReturnValue({
            notifications: mockNotifications,
            loading: false,
        } as any);
        render(<NotificationsComponent />);
        expect(screen.getByText(/user1/i)).toBeInTheDocument();
        expect(screen.getByText(/commented on your spot/i)).toBeInTheDocument();
    });
});
