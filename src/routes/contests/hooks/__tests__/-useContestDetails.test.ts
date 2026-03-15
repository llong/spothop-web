import { renderHook, waitFor } from '@testing-library/react';
import { useContestDetails } from '../-useContestDetails';
import { contestService } from '@/services/contestService';
import { adminContestService } from '@/services/adminContestService';
import { useAtomValue } from 'jotai';
import { useProfileQuery } from '@/hooks/useProfileQueries';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/services/contestService');
vi.mock('@/services/adminContestService');
vi.mock('jotai', async () => {
    const actual = await vi.importActual('jotai');
    return {
        ...actual,
        atom: (initialValue: any) => ({
            read: () => (typeof initialValue === 'function' ? initialValue(undefined) : initialValue),
            write: (_get: any, set: any, arg: any) => set(arg),
            init: initialValue,
            toString: () => 'atom',
            debugLabel: '',
        }),
        useAtomValue: vi.fn(),
    };
});
vi.mock('@/hooks/useProfileQueries');
vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useQuery: vi.fn(),
        useMutation: vi.fn(),
        useQueryClient: vi.fn(),
    };
});

describe('useContestDetails', () => {
    const mockUser = { user: { id: 'user-1' } };
    const mockProfile = { id: 'user-1', role: 'user' };
    const mockContest = { id: 'contest-1', title: 'Contest 1' };
    const mockEntries = [{ id: 'entry-1' }];
    const mockQueryClient = { invalidateQueries: vi.fn() };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAtomValue as any).mockReturnValue(mockUser);
        (useProfileQuery as any).mockReturnValue({ data: mockProfile });
        (useQueryClient as any).mockReturnValue(mockQueryClient);

        // Mock useQuery calls
        (useQuery as any).mockImplementation(({ queryKey }: any) => {
            if (queryKey[0] === 'contests' && queryKey[1] === 'contest-1' && queryKey.length === 2) {
                return { data: mockContest, isLoading: false };
            }
            if (queryKey[2] === 'entries') {
                return { data: mockEntries, isLoading: false };
            }
            if (queryKey[2] === 'my-votes') {
                return { data: ['entry-1'] };
            }
            return { data: null, isLoading: false };
        });

        // Mock useMutation calls
        (useMutation as any).mockImplementation(({ mutationFn, onSuccess }: any) => {
            return {
                mutate: (variables: any) => {
                    mutationFn(variables);
                    onSuccess();
                },
                isPending: false,
            };
        });
    });

    it('returns contest details', () => {
        const { result } = renderHook(() => useContestDetails('contest-1'));

        expect(result.current.contest).toEqual(mockContest);
        expect(result.current.entries).toEqual(mockEntries);
        expect(result.current.userVotes).toEqual(['entry-1']);
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.profile).toEqual(mockProfile);
        expect(result.current.isAdmin).toBe(false);
    });

    it('identifies admin user', () => {
        (useProfileQuery as any).mockReturnValue({ data: { ...mockProfile, role: 'admin' } });
        const { result } = renderHook(() => useContestDetails('contest-1'));

        expect(result.current.isAdmin).toBe(true);
    });

    it('handles vote mutation', async () => {
        const { result } = renderHook(() => useContestDetails('contest-1'));

        result.current.voteForEntry({ entryId: 'entry-2', hasVoted: false });

        await waitFor(() => {
            expect(contestService.voteForEntry).toHaveBeenCalledWith('contest-1', 'entry-2');
            expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['contests', 'contest-1', 'entries'] });
        });
    });

    it('handles remove vote mutation', async () => {
        const { result } = renderHook(() => useContestDetails('contest-1'));

        result.current.voteForEntry({ entryId: 'entry-1', hasVoted: true });

        await waitFor(() => {
            expect(contestService.removeVote).toHaveBeenCalledWith('entry-1');
        });
    });

    it('handles retract entry mutation', async () => {
        const { result } = renderHook(() => useContestDetails('contest-1'));

        result.current.retractEntry('entry-1');

        await waitFor(() => {
            expect(contestService.retractEntry).toHaveBeenCalledWith('entry-1');
            expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['contests', 'contest-1', 'entries'] });
        });
    });

    it('handles disqualify entry mutation', async () => {
        const { result } = renderHook(() => useContestDetails('contest-1'));

        result.current.disqualifyEntry('entry-1');

        await waitFor(() => {
            expect(adminContestService.moderateEntry).toHaveBeenCalledWith('entry-1', 'disqualified');
        });
    });
});
