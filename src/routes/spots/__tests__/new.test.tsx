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

// Mock Leaflet
vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }: any) => <div data-testid="map">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: () => <div data-testid="marker" />,
}));

// Mock Upload Components
vi.mock('../-components/PhotoUpload', () => ({
    PhotoUpload: ({ onUpload }: any) => (
        <button
            data-testid="photo-upload-btn"
            onClick={() => onUpload({
                original: 'http://photo.url/original',
                thumbnailSmall: 'http://photo.url/small',
                thumbnailLarge: 'http://photo.url/large',
            })}
        >
            Mock Upload Photo
        </button>
    ),
}));

vi.mock('../-components/VideoUpload', () => ({
    VideoUpload: ({ onUpload }: any) => (
        <button
            data-testid="video-upload-btn"
            onClick={() => onUpload('http://video.url')}
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

describe('NewSpotComponent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly and populates address from coordinates', async () => {
        render(<NewSpotComponent />);

        expect(screen.getByText('Add a New Spot')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('123 Test St, Test City')).toBeInTheDocument();
        });
    });

    it('shows alert if photo is not uploaded', async () => {
        render(<NewSpotComponent />);

        const submitBtn = screen.getByText('Add Spot');
        fireEvent.click(submitBtn);

        expect(window.alert).toHaveBeenCalledWith('You must upload at least one photo.');
        expect(mockFrom).not.toHaveBeenCalled();
    });

    it('creates a spot successfully with photo and video', async () => {
        render(<NewSpotComponent />);

        // Wait for geocoding to finish
        await screen.findByText('123 Test St, Test City');

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
        const submitBtn = screen.getByText('Add Spot');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            // Check spots insert
            expect(mockFrom).toHaveBeenCalledWith('spots');
            expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(String),
                    name: 'My Cool Spot',
                    description: 'A great place to skate',
                    postal_code: '12345',
                    latitude: 3.125,
                    longitude: 101.677,
                    created_by: 'test-user-id',
                    spot_type: [], // Default empty array as we didn't select any
                    difficulty: 'beginner',
                    kickout_risk: 1,
                    is_lit: false,
                })
            ]));

            // Check photos insert
            expect(mockFrom).toHaveBeenCalledWith('spot_photos');
            expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
                url: 'http://photo.url/original',
                user_id: 'test-user-id',
            }));

            // Check videos insert
            expect(mockFrom).toHaveBeenCalledWith('spot_videos');
            expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
                url: 'http://video.url',
                user_id: 'test-user-id',
            }));

            // Check alert and navigation
            expect(window.alert).toHaveBeenCalledWith('Spot created successfully!');
            expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
        });
    });

    it('handles errors during creation', async () => {
        // Mock error response for spots insert
        mockInsert.mockReturnValueOnce({ error: { message: 'DB Error' } });

        render(<NewSpotComponent />);

        // Setup valid state
        fireEvent.change(screen.getByLabelText(/Spot Name/i), { target: { value: 'Error Spot' } });
        fireEvent.click(screen.getByTestId('photo-upload-btn'));

        fireEvent.click(screen.getByText('Add Spot'));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Failed to create spot: DB Error');
        });
    });
});
