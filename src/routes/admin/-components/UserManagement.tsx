import {
    Box,
    Typography,
    Paper,
    TextField,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Stack,
    Chip,
    ListItemSecondaryAction,
    Button,
    Divider,
} from '@mui/material';
import {
    Person,
    CheckCircleOutline,
    PersonOff,
} from '@mui/icons-material';
import type { UserProfile } from '../../../types';

interface UserManagementProps {
    userSearch: string;
    onSearchChange: (value: string) => void;
    isSearching: boolean;
    users: UserProfile[];
    onToggleBan: (user: UserProfile) => void;
    isActioning: boolean;
}

export function UserManagement({
    userSearch,
    onSearchChange,
    isSearching,
    users,
    onToggleBan,
    isActioning,
}: UserManagementProps) {
    return (
        <Box>
            <Typography variant="h5" gutterBottom fontWeight={700} sx={{ mb: 3 }}>
                Account Moderation
            </Typography>
            <Paper sx={{ p: 2, mb: 4 }}>
                <TextField
                    fullWidth
                    label="Search users by username or display name"
                    variant="outlined"
                    value={userSearch}
                    onChange={(e) => onSearchChange(e.target.value)}
                    InputProps={{
                        startAdornment: <Person sx={{ color: 'action.active', mr: 1 }} />,
                    }}
                />
            </Paper>

            {isSearching ? (
                <Typography>Searching...</Typography>
            ) : users.length > 0 ? (
                <Paper>
                    <List disablePadding>
                        {users.map((user, index) => (
                            <Box key={user.id}>
                                <ListItem sx={{ py: 2 }}>
                                    <ListItemAvatar>
                                        <Avatar
                                            src={user.avatarUrl || undefined}
                                            sx={{ width: 48, height: 48 }}
                                        >
                                            {user.username?.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Typography variant="subtitle1" fontWeight={700}>
                                                    {user.displayName || user.username}
                                                </Typography>
                                                <Chip
                                                    label={user.role}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ height: 20 }}
                                                />
                                            </Stack>
                                        }
                                        secondary={
                                            <Typography variant="body2" color={user.isBanned ? 'error.main' : 'success.main'} sx={{ fontWeight: 600 }}>
                                                {user.isBanned ? "BANNED" : "Active Account"}
                                            </Typography>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Button
                                            variant={user.isBanned ? "outlined" : "contained"}
                                            color={user.isBanned ? "success" : "error"}
                                            startIcon={user.isBanned ? <CheckCircleOutline /> : <PersonOff />}
                                            onClick={() => onToggleBan(user)}
                                            disabled={isActioning}
                                        >
                                            {user.isBanned ? "Unban" : "Ban User"}
                                        </Button>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < users.length - 1 && <Divider />}
                            </Box>
                        ))}
                    </List>
                </Paper>
            ) : userSearch.length > 0 && (
                <Typography color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
                    No users found matching "{userSearch}"
                </Typography>
            )}
        </Box>
    );
}
