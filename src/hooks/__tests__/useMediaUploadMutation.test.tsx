import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMediaUploadMutation } from '../useMediaUploadMutation';
import { useMediaUpload } from '../useMediaUpload';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../useMediaUpload');

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);

describe('useMediaUploadMutation', () => {
    const mockUser = { id: 'u1' } as any;
    const mockSpotId = 's1';
    const mockUploadMedia = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useMediaUpload).mockReturnValue({
            uploadMedia: mockUploadMedia,
            isUploading: false,
            statusMessage: '',
            setStatusMessage: vi.fn(),
            uploadAvatar: vi.fn(),
        } as any);
    });

    it('calls uploadMedia when mutation is triggered', async () => {
        const { result } = renderHook(() => useMediaUploadMutation({ user: mockUser, spotId: mockSpotId }), { wrapper });

        const photos = [new File([''], 'p1.jpg')];
        const videos = [] as any[];

        await act(async () => {
            await result.current.mutateAsync({ photos, videos });
        });

        expect(mockUploadMedia).toHaveBeenCalledWith(mockSpotId, photos, videos);
    });
});
