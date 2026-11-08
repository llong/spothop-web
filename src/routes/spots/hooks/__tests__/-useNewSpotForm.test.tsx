import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
    insert: vi.fn(),
    uploadMedia: vi.fn(),
    deleteSpot: vi.fn(),
    navigate: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('jotai', async (importOriginal) => ({
    ...(await importOriginal<typeof import('jotai')>()),
    useAtomValue: () => ({ user: { id: 'user-1' } }),
}));
vi.mock('uuid', () => ({ v4: () => 'spot-uuid' }));
vi.mock('@/hooks/useMediaUpload', () => ({ useMediaUpload: () => ({ uploadMedia: mocks.uploadMedia }) }));
vi.mock('@/hooks/useOnlineStatus', () => ({ useOnlineStatus: () => true }));
vi.mock('@/utils/geocoding', () => ({ reverseGeocode: vi.fn().mockResolvedValue({}) }));
vi.mock('@/lib/posthog', () => ({ analytics: { capture: vi.fn() } }));
vi.mock('@/supabase', () => ({ default: { from: () => ({ insert: mocks.insert }) } }));
vi.mock('@/services/spotService', () => ({ spotService: { deleteSpot: mocks.deleteSpot } }));

import { useNewSpotForm } from '@/routes/spots/hooks/-useNewSpotForm';
import { queryClient } from '@/lib/queryClient';
import { feedKeys } from '@/hooks/feedKeys';

const fillAndSubmit = async (result: ReturnType<typeof renderHook<ReturnType<typeof useNewSpotForm>, unknown>>['result']) => {
    await waitFor(() => expect(result.current.formState).toBeDefined());
    act(() => {
        result.current.formState.setName('Test Spot');
        result.current.formState.setDescription('A spot');
        result.current.formState.setSelectedPhotos([new File(['x'], 'p.jpg', { type: 'image/jpeg' })]);
    });
    await act(async () => {
        await result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    });
};

describe('useNewSpotForm rollback', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.insert.mockResolvedValue({ error: null });
        mocks.uploadMedia.mockResolvedValue(undefined);
        mocks.deleteSpot.mockResolvedValue(undefined);
    });

    it('rolls back the spot (row and uploaded files) when the media upload fails', async () => {
        mocks.uploadMedia.mockRejectedValue(new Error('Error uploading photo: bucket full'));
        const { result } = renderHook(() => useNewSpotForm(1, 2));

        await fillAndSubmit(result);

        expect(mocks.deleteSpot).toHaveBeenCalledWith('spot-uuid');
        expect(result.current.submissionState.error).toBe('Error uploading photo: bucket full');
        expect(result.current.submissionState.isSubmitting).toBe(false);
    });

    it('still reports the upload error if the rollback itself fails', async () => {
        mocks.uploadMedia.mockRejectedValue(new Error('upload failed'));
        mocks.deleteSpot.mockRejectedValue(new Error('rollback failed'));
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { result } = renderHook(() => useNewSpotForm(1, 2));

        await fillAndSubmit(result);

        expect(result.current.submissionState.error).toBe('upload failed');
        warn.mockRestore();
    });

    it('does not try to roll back when the spot row was never created', async () => {
        mocks.insert.mockResolvedValue({ error: { message: 'insert denied' } });
        const { result } = renderHook(() => useNewSpotForm(1, 2));

        await fillAndSubmit(result);

        expect(mocks.uploadMedia).not.toHaveBeenCalled();
        expect(mocks.deleteSpot).not.toHaveBeenCalled();
        expect(result.current.submissionState.error).toBeTruthy();
    });

    it('does not roll back on success', async () => {
        const { result } = renderHook(() => useNewSpotForm(1, 2));

        await fillAndSubmit(result);

        expect(mocks.uploadMedia).toHaveBeenCalled();
        expect(mocks.deleteSpot).not.toHaveBeenCalled();
        expect(result.current.submissionState.success).toBe(true);
    });

    it('invalidates the feed on success so the new spot appears right away', async () => {
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
        const { result } = renderHook(() => useNewSpotForm(1, 2));

        await fillAndSubmit(result);

        expect(invalidate).toHaveBeenCalledWith({ queryKey: feedKeys.all });
    });
});
