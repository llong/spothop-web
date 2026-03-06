import { renderHook, waitFor, act } from '@testing-library/react';
import { useContestSubmission } from '../-useContestSubmission';
import { contestService } from '@/services/contestService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/services/profileService');
vi.mock('@/services/contestService');
vi.mock('@/services/spotService');
vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useQuery: vi.fn(),
        useMutation: vi.fn(),
        useQueryClient: vi.fn(),
    };
});
vi.mock('@/supabase', () => ({
    default: {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user-id' } } } }),
        },
    },
}));

describe('useContestSubmission', () => {
    const mockProfile = { id: 'test-user-id' };
    const mockUserContent = {
        createdSpots: [
            { id: 'spot-1', name: 'Spot 1', created_at: new Date().toISOString(), created_by: 'test-user-id', spot_type: ['skate_park'] }
        ],
        userMedia: [
            { id: 'media-1', type: 'video', created_at: new Date().toISOString(), spot: { id: 'spot-1' } }
        ]
    };
    const mockContest = {
        id: 'contest-1',
        title: 'Contest 1',
        criteria: {
            required_media_types: ['video'],
            allowed_spot_types: ['skate_park'],
        },
        start_date: new Date().toISOString(),
    } as any;
    const mockSpotDetails = {
        id: 'spot-1',
        media: [
            { id: 'media-1', type: 'video', createdAt: new Date().toISOString(), author: { id: 'test-user-id' } }
        ]
    };
    const mockQueryClient = { invalidateQueries: vi.fn() };

    beforeEach(() => {
        vi.clearAllMocks();
        (useQueryClient as any).mockReturnValue(mockQueryClient);
        
        // Mock useQuery
        (useQuery as any).mockImplementation(({ queryKey }: any) => {
            if (queryKey[0] === 'profile') return { data: mockProfile };
            if (queryKey[0] === 'user-content') return { data: mockUserContent, isLoading: false };
            if (queryKey[0] === 'user-favorites') return { data: [], isLoading: false };
            if (queryKey[0] === 'spot-media') return { data: mockSpotDetails, isLoading: false };
            return { data: null, isLoading: false };
        });

        // Mock useMutation
        (useMutation as any).mockImplementation(({ mutationFn, onSuccess }: any) => ({
            mutate: (variables: any) => {
                mutationFn(variables);
                onSuccess();
            },
            isPending: false,
            error: null,
        }));
    });

    it('filters eligible spots correctly', () => {
        const { result } = renderHook(() => useContestSubmission(mockContest, true, vi.fn()));
        
        expect(result.current.eligibleSpots).toHaveLength(1);
        expect(result.current.eligibleSpots[0].id).toEqual('spot-1');
    });

    it('filters out spots without eligible media', () => {
        const noMediaContest = { ...mockContest, criteria: { required_media_types: ['photo'] } };
        const { result } = renderHook(() => useContestSubmission(noMediaContest, true, vi.fn()));
        
        expect(result.current.eligibleSpots).toHaveLength(0);
    });

    it('filters eligible media for selected spot', () => {
        const { result } = renderHook(() => useContestSubmission(mockContest, true, vi.fn()));
        
        // Need to simulate step 1 selected
        act(() => {
            result.current.setSelectedSpotId('spot-1');
            result.current.setActiveStep(1);
        });

        // Since useQuery depends on selectedSpotId and activeStep, and we mocked useQuery to return spot details always,
        // we just need to check eligibleMedia calculation
        expect(result.current.eligibleMedia).toHaveLength(1);
        expect(result.current.eligibleMedia[0].id).toEqual('media-1');
    });

    it('submits entry', async () => {
        const onClose = vi.fn();
        const { result } = renderHook(() => useContestSubmission(mockContest, true, onClose));

        act(() => {
            result.current.setSelectedSpotId('spot-1');
            result.current.setSelectedMediaId('media-1');
            result.current.setSelectedMediaType('video');
        });

        result.current.submitEntry();

        await waitFor(() => {
            expect(contestService.submitEntry).toHaveBeenCalledWith('contest-1', 'spot-1', 'video', 'media-1');
            expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['contests', 'contest-1', 'entries'] });
            expect(onClose).toHaveBeenCalled();
        });
    });
});
