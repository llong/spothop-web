import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminContestService } from '../../services/adminContestService';
import {
    Box,
    Container,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    MenuItem,
    Grid,
    Autocomplete,
    debounce,
    Slider,
    FormControlLabel,
    Switch,
    ToggleButtonGroup,
    ToggleButton,
    Divider,
    Avatar,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { useState, useEffect, useMemo } from 'react';
import type { Contest, ContestCriteria } from '../../types';
import { ImageUploader } from '@/components/ImageUploader';
import { profileService } from '@/services/profileService';
import { SearchInput } from '@/components/SearchInput/SearchInput';

export const Route = createFileRoute('/admin/contests')({
    component: AdminContestsPage,
});

function AdminContestsPage() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingContest, setEditingContest] = useState<Contest | null>(null);

    const { data: contests } = useQuery({
        queryKey: ['admin', 'contests'],
        queryFn: () => adminContestService.fetchAllContests()
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminContestService.deleteContest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'contests'] });
        }
    });

    const handleEdit = (contest: Contest) => {
        setEditingContest(contest);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setEditingContest(null);
        setIsFormOpen(true);
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold">Manage Contests</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    New Contest
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Timeframe</TableCell>
                            <TableCell>Voting</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {contests?.map((contest) => (
                            <TableRow key={contest.id}>
                                <TableCell sx={{ fontWeight: "medium" }}>{contest.title}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={contest.status.toUpperCase()}
                                        size="small"
                                        color={contest.status === 'active' ? 'success' : 'default'}
                                    />
                                </TableCell>
                                <TableCell>
                                    {new Date(contest.start_date).toLocaleDateString()} - {new Date(contest.end_date).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <Chip label={contest.voting_type} variant="outlined" size="small" />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleEdit(contest)} color="primary">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => {
                                            if (window.confirm('Delete this contest?')) {
                                                deleteMutation.mutate(contest.id);
                                            }
                                        }}
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <ContestFormDialog
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                contest={editingContest}
            />
        </Container>
    );
}

function ContestFormDialog({ open, onClose, contest }: { open: boolean, onClose: () => void, contest: Contest | null }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Partial<Contest>>({
        title: '',
        description: '',
        status: 'draft',
        voting_type: 'public',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        criteria: {} as ContestCriteria
    });
    const [flyerFile, setFlyerFile] = useState<File | null>(null);
    const [judgeSearchResults, setJudgeSearchResults] = useState<any[]>([]);
    const [selectedJudges, setSelectedJudges] = useState<any[]>([]);
    const [radiusUnit, setRadiusUnit] = useState<'km' | 'miles'>('miles');

    useEffect(() => {
        if (!open) return;

        const initialData = contest || {
            title: '',
            description: '',
            status: 'draft',
            voting_type: 'public',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            criteria: {} as ContestCriteria
        };

        setFormData(initialData);

        if (initialData.criteria?.judges?.length) {
            const fetchExistingJudges = async () => {
                const fetchedJudges = await Promise.all(
                    initialData.criteria.judges!.map(id => profileService.fetchIdentity(id))
                );
                setSelectedJudges(fetchedJudges.filter(Boolean));
            };
            fetchExistingJudges();
        } else {
            setSelectedJudges([]);
        }
    }, [contest, open]);

    const debouncedJudgeSearch = useMemo(() =>
        debounce(async (query: string) => {
            if (query.length > 1) {
                const results = await profileService.searchUsers(query);
                setJudgeSearchResults(results);
            } else {
                setJudgeSearchResults([]);
            }
        }, 300),
        []);

    const mutation = useMutation({
        mutationFn: (data: Partial<Contest>) =>
            contest
                ? adminContestService.updateContest(contest.id, data, flyerFile)
                : adminContestService.createContest(data, flyerFile),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'contests'] });
            queryClient.invalidateQueries({ queryKey: ['contests'] });
            onClose();
        }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{contest ? 'Edit Contest' : 'Create New Contest'}</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    name="description"
                                    multiline
                                    rows={3}
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Prize Info"
                                    name="prize_info"
                                    value={formData.prize_info || ''}
                                    onChange={handleChange}
                                    placeholder="e.g., $100 Visa Gift Card"
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <ImageUploader
                            label="Contest Flyer"
                            initialImageUrl={formData.flyer_url}
                            onImageUpload={setFlyerFile}
                            loading={mutation.isPending}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}><Divider /></Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            select
                            fullWidth
                            label="Status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <MenuItem value="draft">Draft</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="voting">Voting</MenuItem>
                            <MenuItem value="finished">Finished</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            select
                            fullWidth
                            label="Voting Type"
                            name="voting_type"
                            value={formData.voting_type}
                            onChange={handleChange}
                        >
                            <MenuItem value="public">Public (Likes)</MenuItem>
                            <MenuItem value="judges">Selected Judges</MenuItem>
                        </TextField>
                    </Grid>

                    {formData.voting_type === 'judges' && (
                        <Grid size={{ xs: 12 }}>
                            <Autocomplete
                                multiple
                                options={judgeSearchResults}
                                getOptionLabel={(option) => option.displayName || option.username || ''}
                                filterOptions={(x) => x}
                                value={selectedJudges}
                                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                                onChange={(_, newValue) => {
                                    setSelectedJudges(newValue);
                                    setFormData(prev => ({
                                        ...prev,
                                        criteria: {
                                            ...prev.criteria,
                                            judges: newValue.map(j => j.id)
                                        }
                                    }));
                                }}
                                onInputChange={(_, newInputValue) => debouncedJudgeSearch(newInputValue)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Select Judges" placeholder="Search by username or name..." />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props} key={option.id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                                            <Avatar
                                                src={option.avatarUrl || undefined}
                                                alt={option.username}
                                                sx={{ width: 24, height: 24 }}
                                            />
                                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                                <Typography variant="body2" noWrap fontWeight={500}>
                                                    {option.displayName || option.username}
                                                </Typography>
                                                {option.displayName && (
                                                    <Typography variant="caption" color="text.secondary" noWrap>
                                                        @{option.username}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </li>
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            avatar={<Avatar src={option.avatarUrl || undefined} alt={option.username} />}
                                            label={option.displayName || option.username}
                                            {...getTagProps({ index })}
                                            key={option.id}
                                        />
                                    ))
                                }
                            />
                        </Grid>
                    )}

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            label="Start Date"
                            name="start_date"
                            type="datetime-local"
                            value={formData.start_date?.split('.')[0]}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            label="End Date"
                            name="end_date"
                            type="datetime-local"
                            value={formData.end_date?.split('.')[0]}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}><Divider /><Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>Submission Criteria</Typography></Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" display="block" gutterBottom color="text.secondary">Allowed Spot Types</Typography>
                        <ToggleButtonGroup
                            value={formData.criteria?.allowed_spot_types || []}
                            onChange={(_, val) => setFormData((prev: Partial<Contest>) => ({ ...prev, criteria: { ...prev.criteria, allowed_spot_types: val } }))}
                            size="small"
                            sx={{ flexWrap: 'wrap', gap: 1 }}
                        >
                            {['rail', 'ledge', 'gap', 'wall_ride', 'skatepark', 'manual_pad'].map(t => (
                                <ToggleButton key={t} value={t} sx={{ borderRadius: '20px !important', border: '1px solid !important', px: 2, textTransform: 'none' }}>{t}</ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" display="block" gutterBottom color="text.secondary">Allowed Rider Types</Typography>
                        <ToggleButtonGroup
                            value={formData.criteria?.allowed_rider_types || []}
                            onChange={(_, val) => setFormData((prev: Partial<Contest>) => ({ ...prev, criteria: { ...prev.criteria, allowed_rider_types: val } }))}
                            size="small"
                            sx={{ flexWrap: 'wrap', gap: 1 }}
                        >
                            {['inline', 'skateboard', 'bmx', 'scooter'].map(t => (
                                <ToggleButton key={t} value={t} sx={{ borderRadius: '20px !important', border: '1px solid !important', px: 2, textTransform: 'none' }}>{t}</ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" display="block" gutterBottom color="text.secondary">Allowed Difficulties</Typography>
                        <ToggleButtonGroup
                            value={formData.criteria?.allowed_difficulties || []}
                            onChange={(_, val) => setFormData((prev: Partial<Contest>) => ({ ...prev, criteria: { ...prev.criteria, allowed_difficulties: val } }))}
                            size="small"
                            sx={{ flexWrap: 'wrap', gap: 1 }}
                        >
                            {['beginner', 'intermediate', 'advanced'].map(t => (
                                <ToggleButton key={t} value={t} sx={{ borderRadius: '20px !important', border: '1px solid !important', px: 2, textTransform: 'none' }}>{t}</ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.criteria?.allowed_is_lit === true}
                                    onChange={(e) => setFormData((prev: Partial<Contest>) => ({ ...prev, criteria: { ...prev.criteria, allowed_is_lit: e.target.checked } }))}
                                />
                            }
                            label="Must be Lit"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ px: 1 }}>
                            <Typography variant="caption" color="text.secondary">Max Kickout Risk: {formData.criteria?.allowed_kickout_risk_max ?? 5}</Typography>
                            <Slider
                                value={formData.criteria?.allowed_kickout_risk_max ?? 5}
                                min={1}
                                max={5}
                                step={1}
                                marks
                                onChange={(_, val) => setFormData((prev: Partial<Contest>) => ({ ...prev, criteria: { ...prev.criteria, allowed_kickout_risk_max: val as number } }))}
                            />
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12 }}><Divider /><Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>Location Restrictions</Typography></Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" display="block" gutterBottom color="text.secondary">Center Location</Typography>
                        <SearchInput
                            onSearch={(_, loc) => {
                                if (loc) {
                                    setFormData(prev => ({
                                        ...prev,
                                        criteria: {
                                            ...prev.criteria,
                                            location_latitude: loc.lat,
                                            location_longitude: loc.lng
                                        }
                                    }));
                                }
                            }}
                            placeholder="Search for center location..."
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ flexGrow: 1, px: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Radius: {radiusUnit === 'miles'
                                        ? ((formData.criteria?.location_radius_km || 0) / 1.60934).toFixed(1)
                                        : (formData.criteria?.location_radius_km || 0).toFixed(1)} {radiusUnit}
                                </Typography>
                                <Slider
                                    value={radiusUnit === 'miles' ? (formData.criteria?.location_radius_km || 0) / 1.60934 : (formData.criteria?.location_radius_km || 0)}
                                    min={0}
                                    max={100}
                                    onChange={(_, val) => {
                                        const km = radiusUnit === 'miles' ? (val as number) * 1.60934 : (val as number);
                                        setFormData((prev: Partial<Contest>) => ({ ...prev, criteria: { ...prev.criteria, location_radius_km: km } }));
                                    }}
                                />
                            </Box>
                            <ToggleButtonGroup
                                value={radiusUnit}
                                exclusive
                                onChange={(_, val) => val && setRadiusUnit(val)}
                                size="small"
                            >
                                <ToggleButton value="miles">Miles</ToggleButton>
                                <ToggleButton value="km">KM</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label="Specific Spot ID Restriction (Optional)"
                            value={formData.criteria?.specific_spot_id || ''}
                            onChange={(e) => setFormData((prev: Partial<Contest>) => ({ ...prev, criteria: { ...prev.criteria, specific_spot_id: e.target.value } }))}
                            helperText="Enter a spot UUID to restrict this contest to one location."
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}><Divider /><Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>Usage Restrictions</Typography></Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.criteria?.require_spot_creator_is_competitor === true}
                                    onChange={(e) => setFormData((prev: Partial<Contest>) => ({ ...prev, criteria: { ...prev.criteria, require_spot_creator_is_competitor: e.target.checked } }))}
                                />
                            }
                            label="Require Competitor Created the Spot"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            select
                            fullWidth
                            label="Spot Creation Time Frame"
                            value={formData.criteria?.spot_creation_time_frame || 'anytime'}
                            onChange={(e) => setFormData((prev: Partial<Contest>) => ({ ...prev, criteria: { ...prev.criteria, spot_creation_time_frame: e.target.value as any } }))}
                        >
                            <MenuItem value="anytime">Anytime</MenuItem>
                            <MenuItem value="during_competition">During Competition</MenuItem>
                            <MenuItem value="last_30_days">Last 30 Days</MenuItem>
                            <MenuItem value="last_60_days">Last 60 Days</MenuItem>
                            <MenuItem value="last_90_days">Last 90 Days</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            select
                            fullWidth
                            label="Media Creation Time Frame"
                            value={formData.criteria?.media_creation_time_frame || 'anytime'}
                            onChange={(e) => setFormData((prev: Partial<Contest>) => ({ ...prev, criteria: { ...prev.criteria, media_creation_time_frame: e.target.value as any } }))}
                        >
                            <MenuItem value="anytime">Anytime</MenuItem>
                            <MenuItem value="during_competition">During Competition</MenuItem>
                            <MenuItem value="last_30_days">Last 30 Days</MenuItem>
                            <MenuItem value="last_60_days">Last 60 Days</MenuItem>
                            <MenuItem value="last_90_days">Last 90 Days</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" display="block" gutterBottom color="text.secondary">Allowed Media Types (Default: Video)</Typography>
                        <ToggleButtonGroup
                            value={formData.criteria?.required_media_types || ['video']}
                            onChange={(_, val) => setFormData((prev: Partial<Contest>) => ({ ...prev, criteria: { ...prev.criteria, required_media_types: val } }))}
                            size="small"
                            sx={{ flexWrap: 'wrap', gap: 1 }}
                        >
                            <ToggleButton value="video" sx={{ borderRadius: '20px !important', border: '1px solid !important', px: 2, textTransform: 'none' }}>Video</ToggleButton>
                            <ToggleButton value="photo" sx={{ borderRadius: '20px !important', border: '1px solid !important', px: 2, textTransform: 'none' }}>Photo</ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            label="Max Entries Per User"
                            type="number"
                            value={formData.criteria?.max_entries_per_user || 1}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setFormData((prev: Partial<Contest>) => ({
                                    ...prev,
                                    criteria: {
                                        ...prev.criteria,
                                        max_entries_per_user: isNaN(val) ? 1 : val
                                    }
                                }));
                            }}
                            helperText="Set to 1 for typical contests, or more for multi-entry challenges."
                        />
                    </Grid>
                </Grid>
            </DialogContent >
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button
                    variant="contained"
                    onClick={() => mutation.mutate(formData)}
                    disabled={mutation.isPending}
                    sx={{ px: 4, borderRadius: 2 }}
                >
                    Save Contest
                </Button>
            </DialogActions>
        </Dialog >
    );
}