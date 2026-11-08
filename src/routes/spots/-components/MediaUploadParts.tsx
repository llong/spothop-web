import type { ChangeEventHandler, ReactNode } from 'react';
import { Box, ButtonBase, Chip, Stack, Typography } from '@mui/material';

interface MediaSectionProps {
    title: string;
    badge: string;
    children: ReactNode;
}

/** Titled block for one kind of media (photos / videos) with a "Required" / "Optional" badge. */
export const MediaSection = ({ title, badge, children }: MediaSectionProps) => (
    <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
            <Chip label={badge} size="small" variant="outlined" color={badge === 'Required' ? 'primary' : 'default'} />
        </Stack>
        {children}
    </Box>
);

interface UploadTileProps {
    icon: ReactNode;
    title: string;
    hint?: string;
    accept: string;
    multiple?: boolean;
    onChange: ChangeEventHandler<HTMLInputElement>;
    /** Small square "+" tile for use inside a grid of previews. */
    compact?: boolean;
}

/** The whole tile is the file picker. Uses theme tokens so it works in light and dark mode. */
export const UploadTile = ({ icon, title, hint, accept, multiple, onChange, compact }: UploadTileProps) => (
    <ButtonBase
        component="label"
        sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            width: '100%',
            ...(compact ? { aspectRatio: '1' } : { py: 3, px: 2 }),
            border: '1.5px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'action.hover',
            color: 'text.secondary',
            textAlign: 'center',
            transition: 'border-color .15s, color .15s, background-color .15s',
            '&:hover, &:focus-within': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'action.selected' },
        }}
    >
        {icon}
        <Typography variant="body2" fontWeight={600} color="inherit">{title}</Typography>
        {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
        <input type="file" hidden accept={accept} multiple={multiple} onChange={onChange} />
    </ButtonBase>
);
