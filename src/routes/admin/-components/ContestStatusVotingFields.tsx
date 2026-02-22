import {
    Grid,
    TextField,
    MenuItem,
    Autocomplete,
    Box,
    Avatar,
    Typography,
    Chip,
} from '@mui/material';
import type { Contest } from '../../../types';

interface ContestStatusVotingFieldsProps {
    formData: Partial<Contest>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    judgeSearchResults: any[];
    selectedJudges: any[];
    onJudgesChange: (newJudges: any[]) => void;
    onJudgeSearch: (query: string) => void;
}

export function ContestStatusVotingFields({
    formData,
    onChange,
    judgeSearchResults,
    selectedJudges,
    onJudgesChange,
    onJudgeSearch,
}: ContestStatusVotingFieldsProps) {
    return (
        <>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    select
                    fullWidth
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={onChange}
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
                    onChange={onChange}
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
                        onChange={(_, newValue) => onJudgesChange(newValue)}
                        onInputChange={(_, newInputValue) => onJudgeSearch(newInputValue)}
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
        </>
    );
}
