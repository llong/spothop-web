import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import {
    Dialog, DialogTitle, DialogContent, List, ListItem, ListItemAvatar,
    Avatar, ListItemText, ListItemSecondaryAction, IconButton, Button,
    TextField, Typography, Box, Stack, Tooltip, CircularProgress,
    Chip, Checkbox, ListItemButton, Divider
} from '@mui/material';
import { RemoveCircleOutline, Save } from '@mui/icons-material';
import type { Conversation } from 'src/services/chatService';
import supabase from 'src/supabase';
import { useQueryClient } from '@tanstack/react-query';

interface ChatSettingsDialogProps {
    open: boolean;
    onClose: () => void;
    chat: Conversation;
    currentUserId: string;
}

export const ChatSettingsDialog: FC<ChatSettingsDialogProps> = ({ open, onClose, chat, currentUserId }) => {
    const [groupName, setGroupName] = useState(chat.name || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const queryClient = useQueryClient();

    const isAdmin = chat.participants.find(p => p.user_id === currentUserId)?.role === 'admin';
    const isMember = chat.participants.some(p => p.user_id === currentUserId && p.status === 'accepted');

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

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(searchQuery);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    const toggleSelectedUser = (user: any) => {
        setSelectedUsers(prev =>
            prev.some(u => u.id === user.id)
                ? prev.filter(u => u.id !== user.id)
                : [...prev, user]
        );
    };

    const handleBulkInvite = async () => {
        if (selectedUsers.length === 0) return;
        setIsSaving(true);
        try {
            const participants = selectedUsers.map(user => ({
                conversation_id: chat.id,
                user_id: user.id,
                status: 'pending'
            }));

            await supabase.from('conversation_participants').insert(participants);
            queryClient.invalidateQueries({ queryKey: ['chat'] });
            setSelectedUsers([]);
            setSearchQuery('');
        } catch (error) {
            console.error('Error inviting users:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveParticipant = async (userId: string) => {
        if (!window.confirm('Remove this user from the chat?')) return;
        setIsSaving(true);
        try {
            await supabase
                .from('conversation_participants')
                .delete()
                .eq('conversation_id', chat.id)
                .eq('user_id', userId);
            queryClient.invalidateQueries({ queryKey: ['chat'] });
        } catch (error) {
            console.error('Error removing participant:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateName = async () => {
        setIsSaving(true);
        try {
            await supabase
                .from('conversations')
                .update({ name: groupName, is_group: true })
                .eq('id', chat.id);
            queryClient.invalidateQueries({ queryKey: ['chat'] });
        } catch (error) {
            console.error('Error updating group name:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Chat Settings</DialogTitle>
            <DialogContent dividers>
                {/* Group Name Section - Group Admin Only */}
                {isAdmin && chat.is_group && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="overline" fontWeight={700} color="text.secondary">Group Identity</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <TextField
                                label="Group Name"
                                size="small"
                                fullWidth
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />
                            <Button
                                variant="contained"
                                startIcon={<Save />}
                                onClick={handleUpdateName}
                                disabled={isSaving || groupName === chat.name}
                            >
                                Save
                            </Button>
                        </Stack>
                    </Box>
                )}

                {/* Participants Section */}
                <Typography variant="overline" fontWeight={700} color="text.secondary">Current Participants</Typography>
                <List sx={{ mb: 2 }}>
                    {chat.participants.map((p) => (
                        <ListItem key={p.id}>
                            <ListItemAvatar>
                                <Avatar src={p.profile?.avatarUrl || ""} />
                            </ListItemAvatar>
                            <ListItemText
                                primary={p.profile?.displayName || p.profile?.username}
                                secondary={`${p.role}${p.status === 'pending' ? ' (Invited)' : ''}`}
                            />
                            {isAdmin && p.user_id !== currentUserId && (
                                <ListItemSecondaryAction>
                                    <Tooltip title="Remove User">
                                        <IconButton edge="end" color="error" onClick={() => handleRemoveParticipant(p.user_id)}>
                                            <RemoveCircleOutline />
                                        </IconButton>
                                    </Tooltip>
                                </ListItemSecondaryAction>
                            )}
                        </ListItem>
                    ))}
                </List>

                <Divider sx={{ my: 2 }} />

                {/* Add Section - Any Member can invite */}
                {isMember && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="overline" fontWeight={700} color="text.secondary">Add to Group</Typography>

                        {/* Selected list for bulk invite */}
                        {selectedUsers.length > 0 && (
                            <Box sx={{ my: 2 }}>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1, mb: 1 }}>
                                    {selectedUsers.map((user) => (
                                        <Chip
                                            key={user.id}
                                            label={user.username}
                                            onDelete={() => toggleSelectedUser(user)}
                                            color="primary"
                                            size="small"
                                        />
                                    ))}
                                </Stack>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleBulkInvite}
                                    disabled={isSaving}
                                    size="small"
                                >
                                    Send {selectedUsers.length} Invitation(s)
                                </Button>
                            </Box>
                        )}

                        <TextField
                            placeholder="Search by username..."
                            size="small"
                            fullWidth
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                endAdornment: isSearching && <CircularProgress size={20} color="inherit" />
                            }}
                            sx={{ mt: 1 }}
                        />

                        <List sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                            {searchResults.map((user) => {
                                const isAlreadyIn = chat.participants.some(p => p.user_id === user.id);
                                const isSelected = selectedUsers.some(u => u.id === user.id);

                                return (
                                    <ListItem
                                        key={user.id}
                                        disablePadding
                                        secondaryAction={
                                            <Checkbox
                                                edge="end"
                                                disabled={isAlreadyIn}
                                                checked={isAlreadyIn || isSelected}
                                                onChange={() => toggleSelectedUser(user)}
                                            />
                                        }
                                    >
                                        <ListItemButton
                                            disabled={isAlreadyIn}
                                            onClick={() => toggleSelectedUser(user)}
                                        >
                                            <ListItemAvatar>
                                                <Avatar src={user.avatarUrl || ""} />
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={user.username}
                                                secondary={isAlreadyIn ? 'Already a member' : ''}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })}
                        </List>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};
