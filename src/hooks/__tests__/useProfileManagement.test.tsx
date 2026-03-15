import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProfileManagement } from '../useProfileManagement';
import { useAtomValue } from 'jotai';
import { useProfileUpdate } from '../useProfileUpdate';
import supabase from 'src/supabase';
import { navigationUtils } from 'src/utils/navigation';

vi.mock('jotai', () => ({
    useAtomValue: vi.fn(),
}));

vi.mock('src/atoms/auth', () => ({
    userAtom: {}
}));

vi.mock('../useProfileUpdate', () => ({
    useProfileUpdate: vi.fn(),
}));

vi.mock('src/supabase', () => ({
    default: {
        auth: {
            signOut: vi.fn(),
        },
    },
}));

vi.mock('src/utils/navigation', () => ({
    navigationUtils: {
        redirectTo: vi.fn(),
    },
}));

describe('useProfileManagement', () => {
    const mockMutateAsync = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Default mock for useAtomValue
        (useAtomValue as any).mockReturnValue({
            user: { id: 'test-user-id' }
        });

        // Default mock for useProfileUpdate
        (useProfileUpdate as any).mockReturnValue({
            mutateAsync: mockMutateAsync,
            isPending: false,
        });
        
        // Mock window alert
        vi.spyOn(window, 'alert').mockImplementation(() => {});
    });

    it('should return expected methods and state', () => {
        const { result } = renderHook(() => useProfileManagement());
        
        expect(result.current.updateProfile).toBeInstanceOf(Function);
        expect(result.current.handleSignOut).toBeInstanceOf(Function);
        expect(result.current.createHandleFormChange).toBeInstanceOf(Function);
        expect(result.current.isUpdating).toBe(false);
    });

    describe('updateProfile', () => {
        it('should do nothing if userId is not present', async () => {
            (useAtomValue as any).mockReturnValue(null);
            const { result } = renderHook(() => useProfileManagement());
            
            const res = await result.current.updateProfile({ name: 'Test' } as any);
            
            expect(mockMutateAsync).not.toHaveBeenCalled();
            expect(res).toBeUndefined();
        });

        it('should call mutateAsync and return result', async () => {
            const mockResult = { data: { name: 'Test' } };
            mockMutateAsync.mockResolvedValueOnce(mockResult);
            
            const { result } = renderHook(() => useProfileManagement());
            const res = await result.current.updateProfile({ name: 'Test' } as any);
            
            expect(mockMutateAsync).toHaveBeenCalledWith({ name: 'Test' });
            expect(res).toEqual(mockResult);
            expect(window.alert).not.toHaveBeenCalled();
        });

        it('should alert if there is an error in result', async () => {
            const mockResult = { error: 'Test error' };
            mockMutateAsync.mockResolvedValueOnce(mockResult);
            
            const { result } = renderHook(() => useProfileManagement());
            const res = await result.current.updateProfile({ name: 'Test' } as any);
            
            expect(mockMutateAsync).toHaveBeenCalledWith({ name: 'Test' });
            expect(window.alert).toHaveBeenCalledWith('Test error');
            expect(res).toEqual(mockResult);
        });
    });

    describe('handleSignOut', () => {
        it('should call supabase signOut and redirect to /', async () => {
            const { result } = renderHook(() => useProfileManagement());
            
            await act(async () => {
                await result.current.handleSignOut();
            });
            
            expect(supabase.auth.signOut).toHaveBeenCalled();
            expect(navigationUtils.redirectTo).toHaveBeenCalledWith('/');
        });

        it('should console.error if sign out fails', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            (supabase.auth.signOut as any).mockRejectedValueOnce(new Error('Signout failed'));
            
            const { result } = renderHook(() => useProfileManagement());
            
            await act(async () => {
                await result.current.handleSignOut();
            });
            
            expect(supabase.auth.signOut).toHaveBeenCalled();
            expect(navigationUtils.redirectTo).not.toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Sign out error:', expect.any(Error));
            
            consoleSpy.mockRestore();
        });
    });

    describe('createHandleFormChange', () => {
        it('should return a change handler that updates state', () => {
            const setFormData = vi.fn();
            const { result } = renderHook(() => useProfileManagement());
            
            const handler = result.current.createHandleFormChange(setFormData);
            
            act(() => {
                handler({ target: { name: 'testName', value: 'testValue' } } as any);
            });
            
            expect(setFormData).toHaveBeenCalled();
            
            // Extract the state updater function passed to setFormData
            const updaterFn = setFormData.mock.calls[0][0];
            const nextState = updaterFn({ otherField: 'otherValue' });
            
            expect(nextState).toEqual({
                otherField: 'otherValue',
                testName: 'testValue'
            });
        });
    });
});
