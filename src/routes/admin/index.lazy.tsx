import { createLazyFileRoute } from '@tanstack/react-router'
import { Container, Typography, Box, Tabs, Tab, Paper, Alert, TextField, Button, Avatar, List, ListItem, ListItemAvatar, ListItemText, ListItemSecondaryAction, Divider } from '@mui/material'
import { useState, useCallback } from 'react'
import { useAdminQueries } from '../../hooks/useAdminQueries'
import type { UserProfile } from '../../types'
import { format } from 'date-fns'
import { adminService } from '../../services/adminService'
import { debounce } from 'lodash'

export const Route = createLazyFileRoute('/admin/')({
    component: AdminDashboard,
})

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState(0)
    const { reports, isLoadingReports, reportsError, resolveReport, deleteContent, toggleBan, isActioning } = useAdminQueries()
    const [userSearch, setUserSearch] = useState('')
    const [users, setUsers] = useState<UserProfile[]>([])
    const [isSearching, setIsSearching] = useState(false)

    const handleTabChange = (_: any, newValue: number) => {
        setActiveTab(newValue)
    }

    const debouncedSearch = useCallback(
        debounce(async (query: string) => {
            if (!query.trim()) {
                setUsers([])
                return
            }
            setIsSearching(true)
            try {
                const results = await adminService.searchUsers(query)
                setUsers(results)
            } catch (error) {
                console.error('Error searching users:', error)
            } finally {
                setIsSearching(false)
            }
        }, 500),
        []
    )

    return (
        <Container sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight={800}>
                Admin Dashboard
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="Pending Reports" />
                    <Tab label="User Management" />
                </Tabs>
            </Box>

            {activeTab === 0 && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Content Moderation Queue
                    </Typography>
                    {reportsError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            Error loading reports: {reportsError.message}
                        </Alert>
                    )}
                    {isLoadingReports ? (
                        <Typography>Loading reports...</Typography>
                    ) : reports.length === 0 ? (
                        <Typography color="text.secondary">No pending reports.</Typography>
                    ) : (
                        reports.map((report) => (
                            <Paper key={report.id} sx={{ p: 2, mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={700}>
                                            {report.target_type.toUpperCase()} Report: {report.reason}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Reported by @{report.reporter?.username} on {format(new Date(report.created_at), 'PPP p')}
                                        </Typography>
                                        {report.details && (
                                            <Typography variant="body1" sx={{ mt: 1 }}>
                                                {report.details}
                                            </Typography>
                                        )}
                                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                            Target ID: {report.target_id}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <button
                                            onClick={() => resolveReport(report.id)}
                                            disabled={isActioning}
                                        >
                                            Dismiss
                                        </button>
                                        <button
                                            onClick={() => deleteContent({ type: report.target_type, id: report.target_id })}
                                            style={{ color: 'red' }}
                                            disabled={isActioning}
                                        >
                                            Delete Target
                                        </button>
                                    </Box>
                                </Box>
                            </Paper>
                        ))
                    )}
                </Box>
            )}

            {activeTab === 1 && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        User Management
                    </Typography>
                    <TextField
                        fullWidth
                        label="Search users by username or display name"
                        variant="outlined"
                        value={userSearch}
                        onChange={(e) => {
                            setUserSearch(e.target.value)
                            debouncedSearch(e.target.value)
                        }}
                        sx={{ mb: 3 }}
                    />

                    {isSearching ? (
                        <Typography>Searching...</Typography>
                    ) : (
                        <List>
                            {users.map((user) => (
                                <Box key={user.id}>
                                    <ListItem>
                                        <ListItemAvatar>
                                            <Avatar src={user.avatarUrl || undefined}>
                                                {user.username?.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={`${user.displayName || user.username} (${user.role})`}
                                            secondary={user.is_banned ? "BANNED" : "Active"}
                                            secondaryTypographyProps={{
                                                color: user.is_banned ? 'error' : 'textSecondary',
                                                fontWeight: user.is_banned ? 700 : 400
                                            }}
                                        />
                                        <ListItemSecondaryAction>
                                            <Button
                                                variant="contained"
                                                color={user.is_banned ? "success" : "error"}
                                                size="small"
                                                onClick={async () => {
                                                    await toggleBan({ userId: user.id, isBanned: !user.is_banned })
                                                    // Refresh the local search result
                                                    const updatedUsers = users.map(u =>
                                                        u.id === user.id ? { ...u, is_banned: !user.is_banned } : u
                                                    )
                                                    setUsers(updatedUsers)
                                                }}
                                                disabled={isActioning}
                                            >
                                                {user.is_banned ? "Unban" : "Ban User"}
                                            </Button>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                    <Divider variant="inset" component="li" />
                                </Box>
                            ))}
                        </List>
                    )}
                </Box>
            )}
        </Container>
    )
}
