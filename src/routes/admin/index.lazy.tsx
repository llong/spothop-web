import { createLazyFileRoute } from '@tanstack/react-router'
import {
    Container,
    Typography,
    Tabs,
    Tab,
    Paper,
    Stack,
} from '@mui/material'
import {
    ReportProblem,
    Person,
    Gavel,
} from '@mui/icons-material'
import { useState, useCallback } from 'react'
import { useAdminQueries } from '../../hooks/useAdminQueries'
import type { UserProfile } from '../../types'
import { adminService } from '../../services/adminService'
import { debounce } from 'lodash'
import { ModerationQueue } from './-components/ModerationQueue'
import { UserManagement } from './-components/UserManagement'

export const Route = createLazyFileRoute('/admin/')({
    component: AdminDashboard,
})

export function AdminDashboard() {
    const [activeTab, setActiveTab] = useState(0)
    const { reports, isLoadingReports, reportsError, resolveReport, deleteContent, toggleBan, isActioning } = useAdminQueries()
    const [userSearch, setUserSearch] = useState('')
    const [users, setUsers] = useState<UserProfile[]>([])
    const [isSearching, setIsSearching] = useState(false)

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
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

    const handleToggleBan = async (user: UserProfile) => {
        const action = user.isBanned ? 'unban' : 'ban';
        if (window.confirm(`Are you sure you want to ${action} ${user.displayName || user.username}?`)) {
            await toggleBan({ userId: user.id, isBanned: !user.isBanned })
            const updatedUsers = users.map(u =>
                u.id === user.id ? { ...u, isBanned: !user.isBanned } : u
            )
            setUsers(updatedUsers)
        }
    };

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
                <ModerationQueue
                    reports={reports}
                    isLoading={isLoadingReports}
                    error={reportsError}
                    onResolve={resolveReport}
                    onDelete={deleteContent}
                    isActioning={isActioning}
                />
            )}

            {activeTab === 1 && (
                <UserManagement
                    userSearch={userSearch}
                    onSearchChange={(val) => {
                        setUserSearch(val);
                        debouncedSearch(val);
                    }}
                    isSearching={isSearching}
                    users={users}
                    onToggleBan={handleToggleBan}
                    isActioning={isActioning}
                />
            )}
        </Container>
    )
}
