import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Typography, Box, List, ListItem, ListItemAvatar,
    Avatar, ListItemText, Checkbox, Stack, CircularProgress,
    ListItemButton, Chip
} from '@mui/material';
import { chatService } from 'src/services/chatService';
import supabase from 'src/supabase';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';

interface CreateGroupDialogProps {
    open: boolean;
    onClose: () => void;
    currentUserId: string;
}

export const CreateGroupDialog: FC<CreateGroupDialogProps> = ({ open, onClose, currentUserId }) => {
    const [name, setName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const handleSearch = useCallback(async (query: string) => {
        if (query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, username, "displayName", "avatarUrl"')
                .ilike('username', `%${query.trim()}%`)
                .neq('id', currentUserId)
                .limit(5);
            setSearchResults(data || []);
        } finally {
            setIsSearching(false);
        }
    }, [currentUserId]);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(searchQuery);
        }, 400); // 400ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    const toggleUser = (user: any) => {
        setSelectedUsers(prev =>
            prev.some(u => u.id === user.id)
                ? prev.filter(u => u.id !== user.id)
                : [...prev, user]
        );
    };

    const handleCreate = async () => {
        if (!name.trim() || selectedUsers.length === 0) return;

        setIsSubmitting(true);
        try {
            const chatId = await chatService.createGroup(
                name.trim(),
                selectedUsers.map(u => u.id),
                currentUserId
            );
            queryClient.invalidateQueries({ queryKey: ['chat', 'inbox'] });
            onClose();
            navigate({ to: '/chat/$conversationId', params: { conversationId: chatId } });
        } catch (error) {
            console.error('Error creating group:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>New Group Chat</DialogTitle>
            <DialogContent dividers>
                <TextField
                    label="Group Name"
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    size="small"
                    placeholder="Enter crew name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    sx={{ mb: 3 }}
                />

                {/* Selected Users section - Persistent list above search */}
                {selectedUsers.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase' }}>
                            Added Participants ({selectedUsers.length})
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                            {selectedUsers.map((user) => (
                                <Chip
                                    key={user.id}
                                    avatar={<Avatar src={user.avatarUrl || ""} />}
                                    label={user.username || 'user'}
                                    onDelete={() => toggleUser(user)}
                                    color="primary"
                                    size="small"
                                />
                            ))}
                        </Stack>
                    </Box>
                )}

                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>Invite Users</Typography>
                    <TextField
                        placeholder="Search by username..."
                        size="small"
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            endAdornment: isSearching && <CircularProgress size={20} color="inherit" />
                        }}
                    />

                    <List sx={{ mt: 1, maxHeight: 250, overflow: 'auto' }}>
                        {searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                                No users found
                            </Typography>
                        )}
                        {searchResults.map((user) => (
                            <ListItem
                                key={user.id}
                                disablePadding
                                secondaryAction={
                                    <Checkbox
                                        edge="end"
                                        onChange={() => toggleUser(user)}
                                        checked={selectedUsers.some(u => u.id === user.id)}
                                    />
                                }
                            >
                                <ListItemButton onClick={() => toggleUser(user)}>
                                    <ListItemAvatar>
                                        <Avatar src={user.avatarUrl || ""} />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={user.displayName || user.username}
                                        secondary={`@${user.username}`}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button
                    variant="contained"
                    disabled={!name.trim() || selectedUsers.length === 0 || isSubmitting}
                    onClick={handleCreate}
                    sx={{ px: 4 }}
                >
                    {isSubmitting ? <CircularProgress size={24} /> : 'Create Group'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
