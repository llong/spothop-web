import { render, screen } from '@testing-library/react';
import SearchAppBar from './SearchAppBar';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMediaQuery } from '@mui/material';
import { useOnlineStatus } from 'src/hooks/useOnlineStatus';
import { useAtomValue } from 'jotai';

// Mock dependencies
vi.mock('@react-google-maps/api', () => ({
    useLoadScript: () => ({ isLoaded: true }),
}));

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/spots' }),
}));

vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jotai')>();
    return {
        ...actual,
        useAtom: vi.fn(() => ['map', vi.fn()]),
        useAtomValue: vi.fn((atom) => {
            if (atom && (atom as any).debugLabel === 'filters') return {};
            if (atom && (atom as any).debugLabel === 'user') return null;
            if (atom && (atom as any).debugLabel === 'isGoogleMapsLoaded') return true;
            return null;
        }),
    };
});

vi.mock('src/hooks/useProfile', () => ({
    useProfile: () => ({ profile: { displayName: 'Test User' } }),
}));

vi.mock('src/hooks/useOnlineStatus', () => ({
    useOnlineStatus: vi.fn(() => true),
}));

vi.mock('./PlaceAutocomplete', () => ({
    PlaceAutocomplete: () => <div data-testid="place-autocomplete" />,
}));

vi.mock('./NavigationItems', () => ({
    NavigationItems: () => <div data-testid="navigation-items" />,
}));

vi.mock('./NotificationBell', () => ({
    NotificationBell: () => <div data-testid="notification-bell" />,
}));

vi.mock('@mui/material', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@mui/material')>();
    return {
        ...actual,
        useMediaQuery: vi.fn(),
    };
});

const theme = createTheme();
const queryClient = new QueryClient();

describe('SearchAppBar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders logo and search components when online on spots page', () => {
        (useMediaQuery as any).mockReturnValue(false); // Desktop
        render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <SearchAppBar />
                </ThemeProvider>
            </QueryClientProvider>
        );

        expect(screen.getByText('SpotHop')).toBeInTheDocument();
        expect(screen.getByTestId('place-autocomplete')).toBeInTheDocument();
    });

    it('shows offline chip when offline', () => {
        vi.mocked(useOnlineStatus).mockReturnValue(false);
        render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <SearchAppBar />
                </ThemeProvider>
            </QueryClientProvider>
        );

        expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('renders notification bell and navigation items on desktop', () => {
        (useMediaQuery as any).mockReturnValue(false); // Desktop
        // Mock user as logged in and google maps as loaded
        vi.mocked(useAtomValue).mockImplementation((atom: any) => {
            if (atom && atom.debugLabel === 'user') return { user: { id: '1' } };
            if (atom && atom.debugLabel === 'filters') return {};
            if (atom && atom.debugLabel === 'isGoogleMapsLoaded') return true;
            return null;
        });

        render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <SearchAppBar />
                </ThemeProvider>
            </QueryClientProvider>
        );

        expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
        expect(screen.getByTestId('navigation-items')).toBeInTheDocument();
    });
});
