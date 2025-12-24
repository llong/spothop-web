import { Box, Typography, TextField, Stack } from '@mui/material';

interface SpotDetailsFormProps {
    name: string;
    setName: (name: string) => void;
    description: string;
    setDescription: (description: string) => void;
    error: string | null;
}

export const SpotDetailsForm = ({ name, setName, description, setDescription, error }: SpotDetailsFormProps) => {
    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">Spot Details</Typography>
                <TextField
                    label="Spot Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    required
                    error={!name && !!error}
                    variant="outlined"
                    placeholder="e.g. 'The Big 4'"
                />
            </Box>

            <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                required
                error={!description && !!error}
                multiline
                rows={4}
                variant="outlined"
                placeholder="Describe the spot, obstacles, surface quality, etc."
            />
        </Stack>
    );
};
