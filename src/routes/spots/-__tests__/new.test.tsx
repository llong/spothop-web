import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NewSpotComponent, Route } from '../new'; // Import Route specifically
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import supabase from 'src/supabase';

// Mock TanStack Router
vi.mock('@tanstack/react-router', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@tanstack/react-router')>();
    return {
        ...actual,
        useNavigate: () => vi.fn(),
        createFileRoute: () => (config: any) => {
            return {
                useSearch: vi.fn().mockReturnValue({ lat: 40.7128, lng: -74.0060 }),
                ...config
            };
        }
    };
});

// Mock other components
vi.mock('../-components/PhotoUpload', () => ({
    PhotoUpload: ({ onFilesSelect }: any) => (
        <button onClick={() => onFilesSelect([new File([''], 'photo.jpg')])}>Mock Photo Upload</button>
    )
}));
vi.mock('../-components/VideoUpload', () => ({
    VideoUpload: () => <div data-testid="video-upload" />
}));
vi.mock('../-components/LocationPreview', () => ({
    LocationPreview: () => <div data-testid="location-preview" />
}));
vi.mock('../-components/SpotDetailsForm', () => ({
    SpotDetailsForm: ({ setName, setDescription }: any) => (
        <div>
            <input aria-label="name-input" onChange={(e) => setName(e.target.value)} />
            <textarea aria-label="description-input" onChange={(e) => setDescription(e.target.value)} />
        </div>
    )
}));
vi.mock('../-components/SpotCharacteristics', () => ({
    SpotCharacteristics: () => <div data-testid="spot-characteristics" />
}));

// Mock atoms
vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jotai')>();
    return {
        ...actual,
        useAtomValue: vi.fn((atom) => {
            if (atom && (atom as any).debugLabel === 'user') return { user: { id: 'u1' } };
            return null;
        }),
    };
});

// Mock Supabase
vi.mock('src/supabase', () => ({
    default: {
        from: vi.fn(() => ({
            insert: vi.fn().mockResolvedValue({ error: null })
        })),
        auth: {
            getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { id: 'u1' } } } }))
        }
    }
}));

const theme = createTheme();
const queryClient = new QueryClient();

describe('NewSpotComponent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.fetch = vi.fn().mockResolvedValue({
            json: () => Promise.resolve({ status: 'success', results: [] })
        }) as any;
    });

    it('renders the form correctly', () => {
        vi.mocked(Route.useSearch).mockReturnValue({ lat: 10, lng: 20 });

        render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <NewSpotComponent />
                </ThemeProvider>
            </QueryClientProvider>
        );

        expect(screen.getByText('Add a New Spot')).toBeInTheDocument();
        expect(screen.getByTestId('video-upload')).toBeInTheDocument();
    });

    it('handles successful submission', async () => {
        const mockInsert = vi.fn().mockResolvedValue({ error: null });
        vi.mocked(supabase.from).mockReturnValue({
            insert: mockInsert
        } as any);

        render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <NewSpotComponent />
                </ThemeProvider>
            </QueryClientProvider>
        );

        // Fill form
        fireEvent.change(screen.getByLabelText('name-input'), { target: { value: 'New Spot' } });
        fireEvent.change(screen.getByLabelText('description-input'), { target: { value: 'Cool place' } });

        // Select photo
        fireEvent.click(screen.getByText('Mock Photo Upload'));

        // Submit
        fireEvent.click(screen.getByRole('button', { name: /Create Spot/i }));

        await waitFor(() => {
            expect(mockInsert).toHaveBeenCalled();
        });
    });
});
