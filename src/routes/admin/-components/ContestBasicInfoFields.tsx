import {
    Grid,
    TextField,
} from '@mui/material';
import type { Contest } from '../../../types';

interface ContestBasicInfoFieldsProps {
    formData: Partial<Contest>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ContestBasicInfoFields({ formData, onChange }: ContestBasicInfoFieldsProps) {
    return (
        <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
                <TextField
                    fullWidth
                    label="Title"
                    name="title"
                    value={formData.title}
                    onChange={onChange}
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
                    onChange={onChange}
                />
            </Grid>
            <Grid size={{ xs: 12 }}>
                <TextField
                    fullWidth
                    label="Prize Info"
                    name="prize_info"
                    value={formData.prize_info || ''}
                    onChange={onChange}
                    placeholder="e.g., $100 Visa Gift Card"
                />
            </Grid>
        </Grid>
    );
}
