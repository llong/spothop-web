import { useCallback, useState } from 'react';
import supabase from 'src/supabase';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import { analytics } from 'src/lib/posthog';

export function useMediaLikes() {
    const user = useAtomValue(userAtom);
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    const toggleLike = useCallback(async (mediaId: string, mediaType: 'photo' | 'video', currentlyLiked: boolean) => {
        if (!user?.user.id) return { success: false, error: 'User not authenticated' };

        setLoading(prev => ({ ...prev, [mediaId]: true }));

        try {
            if (currentlyLiked) {
                const query = supabase
                    .from('media_likes')
                    .delete()
                    .eq('user_id', user.user.id);

                if (mediaType === 'photo') {
                    query.eq('photo_id', mediaId);
                } else {
                    query.eq('video_id', mediaId);
                }

                const { error } = await query;
                if (error) throw error;
                
                analytics.capture('media_unliked', {
                    media_id: mediaId,
                    media_type: mediaType
                });
            } else {
                const { error } = await supabase
                    .from('media_likes')
                    .insert({
                        user_id: user.user.id,
                        photo_id: mediaType === 'photo' ? mediaId : null,
                        video_id: mediaType === 'video' ? mediaId : null,
                        media_type: mediaType
                    });

                if (error) throw error;

                analytics.capture('media_liked', {
                    media_id: mediaId,
                    media_type: mediaType
                });
            }

            return { success: true };
        } catch (error: any) {
            console.error('Error toggling media like:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(prev => ({ ...prev, [mediaId]: false }));
        }
    }, [user]);

    return {
        toggleLike,
        loading
    };
}
