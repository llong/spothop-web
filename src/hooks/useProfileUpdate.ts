import { useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/supabase';
import { profileKeys } from './useProfileQueries';
import { withErrorHandling } from '@/utils/asyncHelpers';
import type { UserProfile } from '@/types';
import type { TablesInsert } from '@/types/database.types';

export const useProfileUpdate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updates: UserProfile) => {
            return withErrorHandling(async () => {
                // Remove derived/virtual fields that aren't in the DB
                const { followerCount: _followerCount, followingCount: _followingCount, ...dbUpdates } = updates as UserProfile & { 
                    followerCount?: number; 
                    followingCount?: number; 
                };

                // UserProfile allows a null username but the DB requires one for inserts; this updates
                // an existing row, which always has a username.
                const { error } = await supabase.from("profiles").upsert({
                    ...dbUpdates,
                    updatedAt: new Date().toISOString()
                } as TablesInsert<'profiles'>);

                if (error) throw error;
                return updates;
            });
        },
        onSuccess: (_, variables) => {
            // Invalidate all profile-related queries
            const userId = variables.id;
            if (userId) {
                queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) });
                queryClient.invalidateQueries({ queryKey: profileKeys.social(userId) });
                queryClient.invalidateQueries({ queryKey: profileKeys.content(userId) });
            }
        }
    });
};