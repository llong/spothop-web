import { useCallback, useState } from 'react';
import supabase from 'src/supabase';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import type { SpotComment } from 'src/types';

export function useComments(spotId: string) {
    const user = useAtomValue(userAtom);
    const [comments, setComments] = useState<SpotComment[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchComments = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch Comments and Reactions
            const { data, error } = await supabase
                .from('spot_comments')
                .select(`
                    *,
                    comment_reactions (user_id, type)
                `)
                .eq('spot_id', spotId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data) {
                // 2. Fetch Authors separately to avoid join issues
                const authorIds = [...new Set(data.map((c: any) => c.user_id))];
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, username, "displayName", "avatarUrl"')
                    .in('id', authorIds);

                const profileMap = new Map(profiles?.map(p => [p.id, p]));

                const userId = user?.user.id;
                const formattedComments = data.map((c: any) => {
                    const likes = c.comment_reactions?.filter((r: any) => r.type === 'like').length || 0;
                    const dislikes = c.comment_reactions?.filter((r: any) => r.type === 'dislike').length || 0;
                    const userReaction = c.comment_reactions?.find((r: any) => r.user_id === userId)?.type || null;
                    const author = profileMap.get(c.user_id);

                    return {
                        ...c,
                        author: {
                            username: author?.username || 'unknown',
                            displayName: author?.displayName || null,
                            avatarUrl: author?.avatarUrl || null
                        },
                        reactions: { likes, dislikes, userReaction }
                    };
                });

                // Build threading
                const commentMap = new Map();
                const roots: SpotComment[] = [];

                formattedComments.forEach(c => {
                    c.replies = [];
                    commentMap.set(c.id, c);
                });

                formattedComments.forEach(c => {
                    if (c.parent_id && commentMap.has(c.parent_id)) {
                        commentMap.get(c.parent_id).replies.push(c);
                    } else {
                        roots.push(c);
                    }
                });

                // Newest comments first
                const commentsSortedByNewest = roots.sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );

                setComments(commentsSortedByNewest);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    }, [spotId, user]);

    const addComment = async (content: string, parentId: string | null = null) => {
        if (!user?.user.id) return { success: false, error: 'Authentication required' };

        try {
            const { data, error } = await supabase
                .from('spot_comments')
                .insert({
                    spot_id: spotId,
                    user_id: user.user.id,
                    content,
                    parent_id: parentId
                })
                .select()
                .single();

            if (error) throw error;

            await fetchComments();
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    const updateComment = async (commentId: string, content: string) => {
        try {
            const { error } = await supabase
                .from('spot_comments')
                .update({ content, is_edited: true })
                .eq('id', commentId);

            if (error) throw error;
            await fetchComments();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    const deleteComment = async (commentId: string) => {
        try {
            const { error } = await supabase
                .from('spot_comments')
                .delete()
                .eq('id', commentId);

            if (error) {
                console.error('Supabase delete error:', error);
                throw error;
            }

            // Update local state immediately for better responsiveness
            setComments(prev => {
                const removeById = (list: SpotComment[]): SpotComment[] => {
                    return list
                        .filter(c => c.id !== commentId)
                        .map(c => ({
                            ...c,
                            replies: c.replies ? removeById(c.replies) : []
                        }));
                };
                return removeById(prev);
            });

            await fetchComments();
            return { success: true };
        } catch (error: any) {
            console.error('Error deleting comment:', error);
            return { success: false, error: error.message };
        }
    };

    const toggleReaction = async (commentId: string, type: 'like' | 'dislike') => {
        if (!user?.user.id) return { success: false, error: 'Authentication required' };

        const currentComment = comments.flatMap(c => [c, ...(c.replies || [])]).find(c => c.id === commentId);
        const currentReaction = currentComment?.reactions?.userReaction;

        try {
            if (currentReaction === type) {
                // Remove reaction
                await supabase
                    .from('comment_reactions')
                    .delete()
                    .eq('comment_id', commentId)
                    .eq('user_id', user.user.id);
            } else {
                // Upsert reaction
                await supabase
                    .from('comment_reactions')
                    .upsert({
                        comment_id: commentId,
                        user_id: user.user.id,
                        type
                    }, { onConflict: 'comment_id,user_id' });
            }
            await fetchComments();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    return {
        comments,
        loading,
        fetchComments,
        addComment,
        updateComment,
        deleteComment,
        toggleReaction
    };
}
