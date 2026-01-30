import { useState, useEffect, useMemo } from 'react';
import { Autocomplete, TextField, CircularProgress, Avatar, Box, Typography } from '@mui/material';
import { profileService } from 'src/services/profileService';
import { debounce } from 'lodash';

interface UserOption {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
}

interface UserSearchInputProps {
    value: UserOption | null | undefined;
    onChange: (user: UserOption | null) => void;
}

export const UserSearchInput = ({ value, onChange }: UserSearchInputProps) => {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<UserOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const fetchUsers = useMemo(
        () =>
            debounce(async (request: { input: string }) => {
                setLoading(true);
                try {
                    const results = await profileService.searchUsers(request.input);
                    setOptions(results);
                } catch (error) {
                    console.error('Error fetching users:', error);
                    setOptions([]);
                } finally {
                    setLoading(false);
                }
            }, 400),
        [],
    );

    useEffect(() => {
        if (inputValue.length < 2) {
            setOptions(value ? [value] : []);
            return;
        }

        fetchUsers({ input: inputValue });
    }, [inputValue, fetchUsers, value]);

    return (
        <Autocomplete
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            getOptionLabel={(option) => option.displayName || option.username}
            filterOptions={(x) => x} // Disable client-side filtering to show all server results
            options={options}
            loading={loading}
            value={value || null}
            onChange={(_, newValue) => onChange(newValue)}
            onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Search User"
                    variant="outlined"
                    size="small"
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
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
                                {option.displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                                @{option.username}
                            </Typography>
                        </Box>
                    </Box>
                </li>
            )}
        />
    );
};