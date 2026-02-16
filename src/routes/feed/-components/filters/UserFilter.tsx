import { Chip, Avatar } from '@mui/material';
import { UserSearchInput } from '../UserSearchInput';
import { type FeedFilters } from 'src/atoms/feed';

interface UserFilterProps {
    author: FeedFilters['author'];
    onChange: (author: FeedFilters['author']) => void;
}

export const UserFilter = ({ author, onChange }: UserFilterProps) => {
    return author ? (
        <Chip
            avatar={<Avatar src={author.avatarUrl || undefined} alt={author.username} />}
            label={`@${author.username}`}
            onDelete={() => onChange(undefined)}
            color="primary"
            variant="outlined"
            sx={{ borderRadius: '16px' }}
        />
    ) : (
        <UserSearchInput
            value={author}
            onChange={(user) => onChange(user || undefined)}
        />
    );
};
