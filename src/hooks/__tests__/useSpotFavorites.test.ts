import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useSpotFavorites } from '../useSpotFavorites';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useToggleFavoriteMutation } from '../useSpotQueries'; // Import the real hook

// Mock useToggleFavoriteMutation from useSpotQueries
vi.mock('../useSpotQueries', () => ({
    spotKeys: {
        all: ['spots'],
        details: vi.fn(() => ['spots', 'detail', 'mock-spot-id']),
    },
    useToggleFavoriteMutation: vi.fn(() => ({
        mutateAsync: vi.fn(), // Mock the mutateAsync function
        isPending: false,
    })),
}));

const queryClient = new QueryClient();

// A wrapper component to provide the QueryClientProvider
const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

describe('useSpotFavorites', () => {
    let mockMutateAsync: Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset the mock for each test
        mockMutateAsync = vi.fn();
        (useToggleFavoriteMutation as Mock).mockReturnValue({
            mutateAsync: mockMutateAsync,
            isPending: false,
        });
    });

    const mockSpot = {
        id: 'spot-1',
        isFavorited: false,
        name: 'Test Spot', // Add name for minimal spot object
        description: '',
        latitude: 0,
        longitude: 0,
    };

    const userId = 'user-1';

    it('initializes with spot.isFavorited value', () => {
        const { result } = renderHook(() => useSpotFavorites(mockSpot as any, userId), { wrapper });
        expect(result.current.isFavorited).toBe(false);

        const { result: result2 } = renderHook(() => useSpotFavorites({ ...mockSpot, isFavorited: true } as any, userId), { wrapper });
        expect(result2.current.isFavorited).toBe(true);
    });

    it('toggles favorite from false to true', async () => {
        const { result } = renderHook(() => useSpotFavorites(mockSpot as any, userId), { wrapper });

        // Initially not favorited
        expect(result.current.isFavorited).toBe(false);

        let toggleResult: any;
        await act(async () => {
            toggleResult = await result.current.toggleFavorite();
        });

        expect(mockMutateAsync).toHaveBeenCalledWith({
            spotId: mockSpot.id,
            userId: userId,
            isFavorited: false, // previous state was false
        });
        expect(result.current.isFavorited).toBe(true); // Optimistic update
        expect(toggleResult?.message).toBe('Added to favorites');
    });

    it('toggles favorite from true to false', async () => {
        const { result } = renderHook(() => useSpotFavorites({ ...mockSpot, isFavorited: true } as any, userId), { wrapper });

        // Initially favorited
        expect(result.current.isFavorited).toBe(true);

        let toggleResult: any;
        await act(async () => {
            toggleResult = await result.current.toggleFavorite();
        });

        expect(mockMutateAsync).toHaveBeenCalledWith({
            spotId: mockSpot.id,
            userId: userId,
            isFavorited: true, // previous state was true
        });
        expect(result.current.isFavorited).toBe(false); // Optimistic update
        expect(toggleResult?.message).toBe('Removed from favorites');
    });

    it('handles errors during toggle', async () => {
        // Make the mutation fail
        mockMutateAsync.mockImplementation(() => {
            throw new Error('Network error');
        });

        const { result } = renderHook(() => useSpotFavorites(mockSpot as any, userId), { wrapper });

        // Before toggle
        expect(result.current.isFavorited).toBe(false);

        let toggleResult: any;
        await act(async () => {
            toggleResult = await result.current.toggleFavorite();
        });

        // Optimistic update happens first, then reverts on error
        expect(result.current.isFavorited).toBe(false); // Reverted to previous state
        expect(toggleResult?.success).toBe(false);
        expect(toggleResult?.message).toBe('Error updating favorite status');
    });
});
