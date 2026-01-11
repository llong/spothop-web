import { useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '../supabase';
import { profileKeys } from './useProfileQueries';
import { withErrorHandling } from '../utils/asyncHelpers';
import type { UserProfile } from '../types';

export const useProfileUpdate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updates: UserProfile) => {
            return withErrorHandling(async () => {
                // Remove derived/virtual fields that aren't in the DB
                const { followerCount, followingCount, ...dbUpdates } = updates as UserProfile & { 
                    followerCount?: number; 
                    followingCount?: number; 
                };

                const { error } = await supabase.from("profiles").upsert({
                    ...dbUpdates,
                    updatedAt: new Date()
                });

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