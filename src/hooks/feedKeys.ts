/** Query keys for the feed. Kept in its own module so mutations elsewhere can invalidate the feed without import cycles. */
export const feedKeys = {
    all: ['feed'] as const,
    global: () => [...feedKeys.all, 'global', 'v3'] as const,
    following: () => [...feedKeys.all, 'following', 'v3'] as const,
    comments: (mediaId: string) => [...feedKeys.all, 'comments', mediaId] as const,
};
