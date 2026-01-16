import { createLazyFileRoute, Link } from '@tanstack/react-router'
import {
    Container,
    Typography,
    Box,
    Tabs,
    Tab,
    Paper,
    Alert,
    TextField,
    Button,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    Stack,
    Chip,
    Grid,
    Card,
    CardMedia,
    CardContent,
} from '@mui/material'
import {
    DeleteForever,
    CheckCircleOutline,
    ReportProblem,
    PersonOff,
    Person,
    Gavel,
} from '@mui/icons-material'
import { useState, useCallback } from 'react'
import { useAdminQueries } from '../../hooks/useAdminQueries'
import type { ContentReport, UserProfile } from '../../types'
import { format } from 'date-fns'
import { adminService } from '../../services/adminService'
import { debounce } from 'lodash'

export const Route = createLazyFileRoute('/admin/')({
    component: AdminDashboard,
})

function ModerationCard({ report }: { report: ContentReport }) {
    return (
        <Card
            variant="outlined"
            sx={{
                bgcolor: 'background.paper',
                cursor: report.context_id ? 'pointer' : 'default',
                '&:hover': report.context_id ? { bgcolor: 'grey.50' } : {},
                overflow: 'hidden'
            }}
        >
            {(report.target_type === 'media' || (report.target_type === 'spot' && report.target_content?.thumbnailUrl)) && (
                <CardMedia
                    component="img"
                    height="160"
                    image={report.target_type === 'spot' ? report.target_content.thumbnailUrl : (report.target_content.thumbnail_url || report.target_content.url)}
                    alt="Content preview"
                    sx={{ objectFit: 'cover', bgcolor: 'black' }}
                />
            )}
            <CardContent>
                {report.target_type === 'spot' && report.target_content && (
                    <>
                        <Typography variant="subtitle1" color="primary" fontWeight={800}>
                            {report.target_content.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {[
                                report.target_content.address,
                                report.target_content.city,
                                report.target_content.state,
                                report.target_content.country
                            ].filter(Boolean).join(', ')}
                        </Typography>
                    </>
                )}
                {report.target_type === 'comment' && report.target_content && (
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary' }}>
                        "{report.target_content.content}"
                    </Typography>
                )}
                {report.target_type === 'media' && report.target_content && (
                    <Typography variant="caption" color="text.secondary">
                        Media ID: {report.target_content.id}
                    </Typography>
                )}
            </CardContent>
        </Card>
    )
}

export function AdminDashboard() {
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
        <Container sx={{ py: 6 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                <Gavel sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h3" component="h1" fontWeight={900}>
                    Admin Dashboard
                </Typography>
            </Stack>

            <Paper sx={{ mb: 4 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab
                        icon={<ReportProblem />}
                        iconPosition="start"
                        label={`Pending Reports (${reports.length})`}
                    />
                    <Tab
                        icon={<Person />}
                        iconPosition="start"
                        label="User Management"
                    />
                </Tabs>
            </Paper>

            {activeTab === 0 && (
                <Box>
                    <Typography variant="h5" gutterBottom fontWeight={700} sx={{ mb: 3 }}>
                        Moderation Queue
                    </Typography>
                    {reportsError && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            Error loading reports: {reportsError.message}
                        </Alert>
                    )}
                    {isLoadingReports ? (
                        <Typography>Loading reports...</Typography>
                    ) : reports.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                            <Typography color="text.secondary">
                                All clear! No pending reports found.
                            </Typography>
                        </Paper>
                    ) : (
                        reports.map((report) => (
                            <Paper key={report.id} sx={{ p: 3, mb: 3, borderLeft: 6, borderColor: 'warning.main' }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid size={{ xs: 12, md: 8 }}>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                            <Chip
                                                label={report.target_type.toUpperCase()}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                sx={{ fontWeight: 700 }}
                                            />
                                            <Typography variant="h6" fontWeight={700}>
                                                {report.reason}
                                            </Typography>
                                        </Stack>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            Reported by <strong>@{report.reporter?.username}</strong> on {format(new Date(report.created_at), 'PPP p')}
                                        </Typography>

                                        {report.details && (
                                            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }}>
                                                <Typography variant="body1">
                                                    "{report.details}"
                                                </Typography>
                                            </Box>
                                        )}

                                        <Typography variant="caption" display="block" sx={{ color: 'grey.500', mb: 2 }}>
                                            Target ID: {report.target_id}
                                        </Typography>

                                        {/* Target Preview Section */}
                                        {report.target_content && (
                                            <Box sx={{ mb: 2 }}>
                                                {report.context_id ? (
                                                    <Link
                                                        to="/spots/$spotId"
                                                        params={{ spotId: report.context_id }}
                                                        style={{ textDecoration: 'none', color: 'inherit' }}
                                                    >
                                                        <ModerationCard report={report} />
                                                    </Link>
                                                ) : (
                                                    <ModerationCard report={report} />
                                                )}
                                            </Box>
                                        )}
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                                            <Button
                                                variant="outlined"
                                                color="inherit"
                                                startIcon={<CheckCircleOutline />}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    resolveReport(report.id);
                                                }}
                                                disabled={isActioning}
                                            >
                                                Dismiss
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="error"
                                                startIcon={<DeleteForever />}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (window.confirm(`Are you sure you want to delete this ${report.target_type}?`)) {
                                                        deleteContent({ type: report.target_type, id: report.target_id })
                                                    }
                                                }}
                                                disabled={isActioning}
                                            >
                                                Delete
                                            </Button>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Paper>
                        ))
                    )}
                </Box>
            )}

            {activeTab === 1 && (
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
                            onChange={(e) => {
                                setUserSearch(e.target.value)
                                debouncedSearch(e.target.value)
                            }}
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
                                                    onClick={async () => {
                                                        const action = user.isBanned ? 'unban' : 'ban';
                                                        if (window.confirm(`Are you sure you want to ${action} ${user.displayName || user.username}?`)) {
                                                            await toggleBan({ userId: user.id, isBanned: !user.isBanned })
                                                            const updatedUsers = users.map(u =>
                                                                u.id === user.id ? { ...u, isBanned: !user.isBanned } : u
                                                            )
                                                            setUsers(updatedUsers)
                                                        }
                                                    }}
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
            )}
        </Container>
    )
}
