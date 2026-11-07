import { useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { userAtom } from '@/atoms/auth';
import { navigationUtils } from '@/utils/navigation';
import { useProfileUpdate } from './useProfileUpdate';
import supabase from '@/supabase';
import type { UserProfile } from '@/types';

export const useProfileManagement = () => {
    const user = useAtomValue(userAtom);
    const userId = user?.user.id;
    const profileUpdate = useProfileUpdate();

    const updateProfile = useCallback(async (updates: UserProfile) => {
        if (!userId) return;

        const result = await profileUpdate.mutateAsync(updates);

        if (result.error) {
            alert(result.error);
        }

        return result;
    }, [userId, profileUpdate]);

    const handleSignOut = useCallback(async () => {
        try {
            await supabase.auth.signOut();
            navigationUtils.redirectTo('/');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }, []);

    const createHandleFormChange = useCallback((
        setFormData: React.Dispatch<React.SetStateAction<UserProfile | null>>
    ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev!, [name]: value }));
    }, []);

    return {
        updateProfile,
        handleSignOut,
        createHandleFormChange,
        isUpdating: profileUpdate.isPending
    };
};