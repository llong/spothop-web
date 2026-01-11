import { Box, TextField, Grid, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material";

interface ProfileFormProps {
    formData: any;
    onFormChange: (e: any) => void;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    onSignOut: () => void;
    isUpdating: boolean;
}

export const ProfileForm = ({ formData, onFormChange, onSubmit, onSignOut, isUpdating }: ProfileFormProps) => {
    return (
        <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 3 }}>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        id="displayName"
                        name="displayName"
                        label="Display Name"
                        type="text"
                        value={formData.displayName || ""}
                        onChange={onFormChange}
                        fullWidth
                        helperText="This is how you will appear to other users."
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        id="city"
                        name="city"
                        label="City"
                        type="text"
                        value={formData.city || ""}
                        onChange={onFormChange}
                        fullWidth
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        id="country"
                        name="country"
                        label="Country"
                        type="text"
                        value={formData.country || ""}
                        onChange={onFormChange}
                        fullWidth
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        id="bio"
                        name="bio"
                        label="Bio"
                        multiline
                        rows={4}
                        value={formData.bio || ""}
                        onChange={onFormChange}
                        fullWidth
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                        <InputLabel id="riderType-label">Rider Type</InputLabel>
                        <Select
                            labelId="riderType-label"
                            id="riderType"
                            name="riderType"
                            value={formData.riderType || ""}
                            label="Rider Type"
                            onChange={onFormChange}
                        >
                            <MenuItem value="inline">Inline</MenuItem>
                            <MenuItem value="skateboard">Skateboard</MenuItem>
                            <MenuItem value="bmx">BMX</MenuItem>
                            <MenuItem value="scooter">Scooter</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        id="instagramHandle"
                        name="instagramHandle"
                        label="Instagram Handle"
                        type="text"
                        value={formData.instagramHandle || ""}
                        onChange={onFormChange}
                        fullWidth
                    />
                </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                    type="button"
                    variant="contained"
                    color="error"
                    onClick={onSignOut}
                >
                    Sign Out
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={isUpdating}
                >
                    Update Profile
                </Button>
            </Box>
        </Box>
    );
};