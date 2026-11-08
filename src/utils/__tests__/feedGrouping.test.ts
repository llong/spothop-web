import { describe, it, expect } from 'vitest';
import { groupFeedItems, GROUP_GAP_MS } from '@/utils/feedGrouping';
import type { FeedItem } from '@/types';

const at = (seconds: number) => new Date(Date.UTC(2026, 10, 8, 12, 0, 0) + seconds * 1000).toISOString();

const item = (media_id: string, seconds: number, over: Partial<FeedItem> = {}): FeedItem => ({
    media_id,
    spot_id: 'spot-1',
    uploader_id: 'user-1',
    media_url: `https://x/${media_id}`,
    media_type: 'photo',
    created_at: at(seconds),
    spot_name: 'Spot',
    uploader_username: 'u',
    uploader_display_name: null,
    uploader_avatar_url: null,
    is_followed_by_user: false,
    like_count: 0,
    comment_count: 0,
    popularity_score: 0,
    ...over,
});

const ids = (groups: ReturnType<typeof groupFeedItems>) => groups.map((g) => g.items.map((i) => i.media_id));

describe('groupFeedItems', () => {
    it('returns nothing for an empty feed', () => {
        expect(groupFeedItems([])).toEqual([]);
    });

    it('groups media uploaded together by the same user to the same spot, photos oldest first', () => {
        const groups = groupFeedItems([item('p3', 3), item('p2', 2), item('p1', 1)]);

        expect(ids(groups)).toEqual([['p1', 'p2', 'p3']]);
    });

    it('puts a video with a thumbnail first, then the photos in upload order', () => {
        // the feed is newest first: video (last uploaded), then photo 2, then photo 1
        const video = item('video', 20, { media_type: 'video', thumbnail_url: 'https://x/thumb' });
        const groups = groupFeedItems([video, item('p2', 2), item('p1', 1)]);

        expect(ids(groups)).toEqual([['video', 'p1', 'p2']]);
    });

    it('keeps a video without a thumbnail after the photos (it would show as an empty tile)', () => {
        const noThumb = item('video', 20, { media_type: 'video', thumbnail_url: '' });
        const groups = groupFeedItems([noThumb, item('p2', 2), item('p1', 1)]);

        expect(ids(groups)).toEqual([['p1', 'p2', 'video']]);
    });

    it('orders several videos among themselves by upload time', () => {
        const v = (id: string, s: number) => item(id, s, { media_type: 'video', thumbnail_url: 'https://x/t' });
        const groups = groupFeedItems([v('v2', 30), v('v1', 20), item('p1', 1)]);

        expect(ids(groups)).toEqual([['v1', 'v2', 'p1']]);
    });

    it('keeps a stable key (the newest item) so the card is not remounted when the group grows', () => {
        const page1 = groupFeedItems([item('p3', 3), item('p2', 2)]);
        const page2 = groupFeedItems([item('p3', 3), item('p2', 2), item('p1', 1)]);

        expect(page1[0].key).toBe('p3');
        expect(page2[0].key).toBe('p3');
    });

    it('starts a new post when the gap is too large (media added to the spot later)', () => {
        const groups = groupFeedItems([item('later', GROUP_GAP_MS / 1000 + 100), item('first', 0)]);

        expect(ids(groups)).toEqual([['later'], ['first']]);
    });

    it('does not mix different spots or different users', () => {
        const groups = groupFeedItems([
            item('a', 3),
            item('b', 2, { spot_id: 'spot-2' }),
            item('c', 1, { uploader_id: 'user-2' }),
        ]);

        expect(ids(groups)).toEqual([['a'], ['b'], ['c']]);
    });

    it('groups across interleaved uploads from other people', () => {
        const groups = groupFeedItems([item('a2', 5), item('other', 4, { uploader_id: 'user-2' }), item('a1', 3)]);

        expect(ids(groups)).toEqual([['a1', 'a2'], ['other']]);
    });

    it('keeps groups in feed order (by their newest media)', () => {
        const groups = groupFeedItems([item('x', 100, { spot_id: 's2' }), item('a2', 50), item('a1', 49)]);

        expect(groups.map((g) => g.key)).toEqual(['x', 'a2']);
    });
});
