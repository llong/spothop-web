import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewSpotComponent } from '../new';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
const { mockInsert, mockFrom, mockSupabase, mockNavigate, mockUseSearch } = vi.hoisted(() => {
    const mockInsert = vi.fn();
    const mockFrom = vi.fn(() => ({
        insert: mockInsert.mockReturnValue({ error: null }),
    }));

    const mockSupabase = {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user-id' } } } }),
        },
        from: mockFrom,
        storage: {
            from: () => ({
                upload: vi.fn().mockResolvedValue({ error: null }),
                getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'http://mock.url' } }),
            }),
        },
    };

    const mockNavigate = vi.fn();
    const mockUseSearch = vi.fn(() => ({ lat: 3.125, lng: 101.677 }));

    return { mockInsert, mockFrom, mockSupabase, mockNavigate, mockUseSearch };
});

vi.mock('src/supabase', () => ({ default: mockSupabase }));

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => mockNavigate,
    createFileRoute: () => () => ({
        useSearch: mockUseSearch,
    }),
    redirect: vi.fn(),
}));

// Mock Jotai
vi.mock('jotai', () => ({
    useAtomValue: vi.fn(() => ({ user: { id: 'test-user-id' } })),
    atom: vi.fn(() => ({})),
}));

// Mock useMediaUpload
vi.mock('src/hooks/useMediaUpload', () => ({
    useMediaUpload: () => ({
        uploadMedia: vi.fn().mockResolvedValue(true),
    }),
}));

// Mock Online Status
vi.mock('src/hooks/useOnlineStatus', () => ({
    useOnlineStatus: vi.fn(() => true),
}));

// Mock Leaflet
vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }: any) => <div data-testid="map">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: () => <div data-testid="marker" />,
}));

// Mock Upload Components
vi.mock('../-components/PhotoUpload', () => ({
    PhotoUpload: ({ onFilesSelect }: any) => (
        <button
            data-testid="photo-upload-btn"
            onClick={() => onFilesSelect([new File([], 'test.jpg')])}
        >
            Mock Upload Photo
        </button>
    ),
}));

vi.mock('../-components/VideoUpload', () => ({
    VideoUpload: ({ onFilesSelect }: any) => (
        <button
            data-testid="video-upload-btn"
            onClick={() => onFilesSelect([{ file: new File([], 'test.mp4'), thumbnail: new Blob() }])}
        >
            Mock Upload Video
        </button>
    ),
}));

// Mock Fetch for Geocoding
window.fetch = vi.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({
            results: [{
                formatted_address: '123 Test St, Test City',
                address_components: [
                    { types: ['postal_code'], long_name: '12345' }
                ]
            }]
        }),
    })
) as any;

// Mock Alert
window.alert = vi.fn();

// Helper to provide route context if needed
// But since we mocked the whole module, it should work if we handle the Route object

describe('NewSpotComponent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Ensure Route.useSearch returns our mock
        (NewSpotComponent as any).Route = {
            useSearch: mockUseSearch
        };
    });

    it('renders correctly and populates address from coordinates', async () => {
        render(<NewSpotComponent />);

        expect(screen.getByText('Add a New Spot')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('123 Test St, Test City')).toBeInTheDocument();
        });
    });

    it('shows error if photo is not uploaded', async () => {
        render(<NewSpotComponent />);

        // Fill required text fields first
        fireEvent.change(screen.getByLabelText(/Spot Name/i), { target: { value: 'Test Spot' } });
        fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Test Desc' } });

        const submitBtn = screen.getByText('Create Spot');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText(/You must upload at least one photo/i)).toBeInTheDocument();
        });
        expect(mockFrom).not.toHaveBeenCalled();
    });

    it('creates a spot successfully with photo and video', async () => {
        render(<NewSpotComponent />);

        // Wait for geocoding to finish
        await waitFor(() => {
            expect(screen.getByText('123 Test St, Test City')).toBeInTheDocument();
        }, { timeout: 5000 });

        // Fill form
        const nameInput = screen.getByLabelText(/Spot Name/i);
        const descInput = screen.getByLabelText(/Description/i);

        fireEvent.change(nameInput, { target: { value: 'My Cool Spot' } });
        fireEvent.change(descInput, { target: { value: 'A great place to skate' } });

        // Upload Photo
        const photoBtn = screen.getByTestId('photo-upload-btn');
        fireEvent.click(photoBtn);

        // Upload Video
        const videoBtn = screen.getByTestId('video-upload-btn');
        fireEvent.click(videoBtn);

        // Submit
        const submitBtn = screen.getByRole('button', { name: /Create Spot/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            // Check spots insert
            expect(mockFrom).toHaveBeenCalledWith('spots');
        }, { timeout: 5000 });

        expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
                name: 'My Cool Spot',
                description: 'A great place to skate',
            })
        ]));

        // Check success message (use getAll as it appears in Snackbar and Button)
        await waitFor(() => {
            expect(screen.getAllByText(/Spot created successfully!/i).length).toBeGreaterThan(0);
        });
    }, 10000);

    it('handles errors during creation', async () => {
        // Mock error response for spots insert
        mockInsert.mockReturnValueOnce({ error: { message: 'DB Error' } });

        render(<NewSpotComponent />);

        // Setup valid state
        fireEvent.change(screen.getByLabelText(/Spot Name/i), { target: { value: 'Error Spot' } });
        fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Error Desc' } });
        fireEvent.click(screen.getByTestId('photo-upload-btn'));

        fireEvent.click(screen.getByText('Create Spot'));

        await waitFor(() => {
            expect(screen.getByText(/DB Error/i)).toBeInTheDocument();
        });
    });
});
