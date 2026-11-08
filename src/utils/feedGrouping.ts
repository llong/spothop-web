import type { FeedItem } from '@/types';

/** Media added to the same spot by the same user within this gap of each other belongs to one post. */
export const GROUP_GAP_MS = 5 * 60 * 1000;

export interface FeedGroup {
    /** Stable while the group grows (older media loaded by later pages is added after the newest). */
    key: string;
    /** Videos first (the most engaging), then the photos, each in upload order. */
    items: FeedItem[];
}

const time = (item: FeedItem) => new Date(item.created_at).getTime();

/** Videos lead their post: every video has a thumbnail, and video is the most engaging media. */
const leadsPost = (item: FeedItem) => item.media_type === 'video';

/**
 * Turns the feed's one-row-per-photo/video into one post per upload: consecutive media from the same
 * user and spot, uploaded close together, become a single group shown as a carousel (videos first).
 * Groups appear where their newest media does, so the feed order is unchanged.
 */
export function groupFeedItems(items: FeedItem[]): FeedGroup[] {
    const groups: FeedGroup[] = [];
    const latestGroup = new Map<string, FeedGroup>();

    for (const item of items) {
        const id = `${item.spot_id}|${item.uploader_id}`;
        const group = latestGroup.get(id);
        const previous = group?.items[group.items.length - 1];

        if (group && previous && Math.abs(time(previous) - time(item)) <= GROUP_GAP_MS) {
            group.items.push(item);
        } else {
            const created = { key: item.media_id, items: [item] };
            groups.push(created);
            latestGroup.set(id, created);
        }
    }

    for (const group of groups) {
        group.items.sort((a, b) => Number(leadsPost(b)) - Number(leadsPost(a)) || time(a) - time(b));
    }
    return groups;
}
